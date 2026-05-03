from langchain_chroma import Chroma
from langchain_groq import ChatGroq
from langchain_nomic import NomicEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyMuPDFLoader
from pydantic_models import *
from auth_utils import *
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, BackgroundTasks
import shutil
import requests
from database import Project

router = APIRouter(
    prefix="",
    tags=["nora stuff"]
)

embeddings = NomicEmbeddings(
    model="nomic-embed-text-v1.5", 
    nomic_api_key=os.getenv("NOMIC_API_KEY")
)

# Pour le cerveau (LLM), on passe sur Groq avec Llama 3.3 (le plus costaud)
llm = ChatGroq(
    temperature=0.1, # On reste précis pour une archive
    model_name="llama-3.3-70b-versatile", 
    groq_api_key=os.getenv("GROQ_API_KEY")
)

text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
CHROMA_PATH = "./nora_vectors"

@router.post("/chatbot/ask")
async def ask_nora(request: ChatRequest):
    try:
        # 1. Recherche dans ChromaDB
        vector_db = Chroma(persist_directory=CHROMA_PATH, embedding_function=embeddings)
        docs = vector_db.similarity_search(request.query, k=5)
        
        #1. On récupère les sources uniques avec leurs liens
        sources = []
        seen_titles = set()
        for doc in docs:
            title = doc.metadata.get('title', 'Archive')
            url = doc.metadata.get('pdf_url') # Assure-toi de l'avoir mis à l'ingestion !
            if title not in seen_titles:
                sources.append({"title": title, "url": url})
                seen_titles.add(title)
        
        # 2. Préparation du contexte avec les sources
        context_parts = []
        for doc in docs:
            source = doc.metadata.get('title', 'Archive inconnue')
            context_parts.append(f"[Source: {source}]\n{doc.page_content}")
        
        context = "\n\n---\n\n".join(context_parts)

        # 3. LE SYSTEM PROMPT (Tes règles d'or)
        system_instructions = f"""
        Tu es Nora, l'IA experte du DIT. Ton but est de synthétiser les archives du Dakar Institute of Technology.

        RÈGLES DE RÉPONSE ET CITATION :
        1. Analyse le contexte fourni pour répondre. Si l'info n'y est pas, dis-le poliment.
        2. SYNTHÈSE : Ne liste pas les sources une par une si elles disent la même chose. Regroupe tes idées.
        3. CITATION DISCRÈTE : Cite les sources entre parenthèses ou en fin de phrase, par exemple : (Source: Projet Riz, 2023). 
        4. PERTINENCE : Ne cite un projet que si l'information que tu donnes provient directement de lui. Si tu fais une réponse générale basée sur 3 projets, écris "Selon les archives des projets X, Y et Z..." au début.
        5. STYLE : Reste concise. L'utilisateur veut une réponse, pas une bibliographie.
        6. STRUCTURE : Utilise des listes à puces (-) pour les énumérations.
        7. EMPHASE : Mets en **gras** les dates, les chiffres clés, les noms de technologies et les noms propres.
        CONTEXTE DES ARCHIVES :
        {context}
        """

        # 4. RECONSTRUCTION DE LA CONVERSATION (Historique + Question actuelle)
        messages_for_ai = [
            ("system", system_instructions)
        ]
        
        # On ajoute les messages précédents (l'historique)
        for msg in request.history:
            role = "human" if msg.role == "user" else "assistant"
            messages_for_ai.append((role, msg.content))
            
        # On ajoute la question actuelle si elle n'est pas déjà dans l'historique envoyé
        # Si ton front envoie l'historique SANS la dernière question :
        messages_for_ai.append(("human", request.query))

        # 5. Appel à Groq
        response = llm.invoke(messages_for_ai)
        
        return {"answer": response.content}
        
    except Exception as e:
        print(f"❌ Erreur Nora: {e}")
        return {"answer": "Je n'arrive pas à fouiller dans mes dossiers pour le moment.",
                "answer": response.content,
                "sources": sources
                
                }

@router.post("/chatbot/upload-doc")
async def upload_document_to_nora(
    background_tasks: BackgroundTasks, 
    file: UploadFile = File(...)
):
    """L'admin upload un PDF quelconque pour enrichir Nora."""
    # 1. Créer le dossier temp s'il n'existe pas
    os.makedirs("temp_storage", exist_ok=True)
    file_path = f"temp_storage/{file.filename}"

    # 2. Sauvegarder physiquement le fichier pour que PyMuPDF puisse le lire
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # 3. Lancer l'ingestion en tâche de fond
    background_tasks.add_task(process_pdf_logic, file_path, metadata={"source": file.filename})

    return {"message": f"Analyse de {file.filename} lancée."}

def download_pdf(url: str, dest: str):
    response = requests.get(url)
    if response.status_code == 200:
        with open(dest, "wb") as f:
            f.write(response.content)
        return True
    return False

@router.post("/chatbot/ingest/{project_id}")
async def auto_ingest_project(project_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Récupère le mémoire du projet et l'envoie à Nora."""
    
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project or not project.report_pdf_url:
        raise HTTPException(status_code=404, detail="Projet ou PDF introuvable")

    # Chemin local temporaire
    os.makedirs("temp_storage", exist_ok=True)
    local_pdf = f"temp_storage/project_{project_id}.pdf"

    # On définit la logique de téléchargement + traitement
    def full_ingestion_flow():
        if download_pdf(project.report_pdf_url, local_pdf):
            process_pdf_logic(local_pdf, metadata={
                "project_id": project_id,
                "title": project.title,
                "author": project.author
            })
            # Nettoyage après ingestion
            if os.path.exists(local_pdf):
                os.remove(local_pdf)

    background_tasks.add_task(full_ingestion_flow)
    return {"message": "Nora commence l'apprentissage du projet."}


def process_pdf_logic(file_path: str, metadata: dict):
    """La cuisine interne : PDF -> Texte -> Chunks -> Vecteurs -> ChromaDB."""
    try:
        loader = PyMuPDFLoader(file_path)
        documents = loader.load()
        chunks = text_splitter.split_documents(documents)
        
        for chunk in chunks:
            # On s'assure d'avoir un nom lisible pour le frontend
            clean_name = metadata.get('title') or metadata.get('source') or "Document"
            chunk.metadata.update(metadata)
        chunk.metadata["title"] = clean_name # On force le titre pour le GET
        chunk.metadata["source"] = clean_name # On force la source pour le DELETE
            
        # 4. Initialiser la DB et ajouter les documents
        # Utiliser .from_documents sur le même persist_directory va APPEND (ajouter) 
        # les nouveaux vecteurs à l'existant.
        vector_db = Chroma.from_documents(
            documents=chunks, 
            embedding=embeddings, 
            persist_directory=CHROMA_PATH
        )
        
    except Exception as e:
        print(f"❌ Erreur lors du process_pdf: {e}")
    finally:
        # Nettoyage systématique du fichier temporaire pour ne pas saturer le serveur
        if os.path.exists(file_path):
            os.remove(file_path)
            print(f"🗑️ Nettoyage : {file_path} supprimé.")

@router.get("/chatbot/documents")
async def list_nora_documents():
    """Récupère la liste des documents uniques ingérés par Nora."""
    try:
        vector_db = Chroma(persist_directory=CHROMA_PATH, embedding_function=embeddings)
        
        # On récupère toutes les métadonnées de la collection
        data = vector_db.get()
        metadatas = data.get('metadatas', [])
        
        # On extrait les noms de fichiers/titres uniques
        unique_docs = {}
        for meta in metadatas:
            # On utilise le 'source' ou 'title' comme clé unique
            name = meta.get('title') or meta.get('source', 'Document inconnu')
            if name not in unique_docs:
                unique_docs[name] = {
                    "id": name, # On utilise le nom comme ID pour la suppression simple
                    "name": name,
                    "created_at": "Archives DIT" # Chroma ne stocke pas la date par défaut
                }
        
        return list(unique_docs.values())
    except Exception as e:
        print(f"❌ Erreur listage: {e}")
        return []

@router.delete("/chatbot/documents/{doc_name}")
async def delete_nora_document(doc_name: str):
    """Supprime un document de la mémoire de Nora via son nom/source."""
    try:
        vector_db = Chroma(persist_directory=CHROMA_PATH, embedding_function=embeddings)
        
        # Suppression par filtre sur les métadonnées
        # Attention : On teste sur 'title' ET 'source' pour être sûr
        vector_db.delete(where={"source": doc_name})
        # Si tu as stocké sous 'title', tu peux aussi faire :
        # vector_db.delete(where={"title": doc_name})
        
        return {"message": f"Document {doc_name} oublié par Nora."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'oubli : {str(e)}")