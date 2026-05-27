import os
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, UploadFile, File
from sqlalchemy.orm import Session

from langchain_chroma import Chroma
from langchain_groq import ChatGroq
from langchain_nomic import NomicEmbeddings

from config.database import get_db
from models.sql_models import User, Program, ConversationLog, Project
from models.pydantic_models import ChatPayload, FeedbackPayload # On centralise sur ChatPayload
from utils.auth_utils import get_current_user
from config.system_prompts import get_nora_chat_system_prompt
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyMuPDFLoader

import shutil
import requests

router = APIRouter(
    prefix="",
    tags=["nora stuff"]
)

# Configuration de Nomic
embeddings = NomicEmbeddings(
    model="nomic-embed-text-v1.5", 
    nomic_api_key=os.getenv("NOMIC_API_KEY")
)

# Configuration de Groq avec Llama 3.3
llm = ChatGroq(
    temperature=0.1, 
    model_name="llama-3.3-70b-versatile", 
    groq_api_key=os.getenv("GROQ_API_KEY")
)

CHROMA_PATH = "./nora_vectors"

@router.post("/chatbot/ask")
async def ask_nora(payload: ChatPayload, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Initialisation de la variable sources en haut du scope pour securiser le bloc except
    sources = []
    try:
        # 1. Connexion a ChromaDB
        vector_db = Chroma(persist_directory=CHROMA_PATH, embedding_function=embeddings)
        
        # Recupere un eventuel project_id depuis le payload (ajoute-le a ton Pydantic ChatPayload si besoin)
        project_id_filter = getattr(payload, "project_id", None)
        
        docs_with_scores = []
        
        if project_id_filter:
            # CAS A : L'etudiant est sur un projet specifique -> Filtre absolu sur le projet
            search_kwargs = {"k": 4, "filter": {"project_id": int(project_id_filter)}}
            docs = vector_db.similarity_search(payload.query, **search_kwargs)
            # On simule un score parfait de 0.0 (distance minimale) pour la compatibilite du code plus bas
            docs_with_scores = [(doc, 0.0) for doc in docs]
        else:
            # CAS B : Recherche globale -> Filtrage par pertinence pour eviter les hallucinations
            # similarity_search_with_score renvoie des tuples (Document, Distance)
            # Attention : Dans ChromaDB, plus la distance est PETITE, plus le document est proche/pertinent.
            raw_docs_with_scores = vector_db.similarity_search_with_score(payload.query, k=5)
            
            # Seuil de tolérance (Distance maximum autorisee, ajuste entre 0.4 et 0.6 selon tes tests)
            MAX_DISTANCE_THRESHOLD = 0.55
            
            # On ne garde que les documents dont la distance est inferieure au seuil
            docs_with_scores = [
                (doc, score) for doc, score in raw_docs_with_scores if score <= MAX_DISTANCE_THRESHOLD
            ]
        
        # Extraction des documents valides pour la suite du traitement
        filtered_docs = [doc for doc, _ in docs_with_scores]
        
        # 2. Extraction des sources uniques
        seen_titles = set()
        for doc in filtered_docs:
            title = doc.metadata.get('title', 'Archive')
            url = doc.metadata.get('pdf_url')
            if title not in seen_titles:
                sources.append({"title": title, "url": url})
                seen_titles.add(title)
        
        # 3. Preparation du contexte extrait pour le LLM
        context_parts = []
        for doc in filtered_docs:
            source = doc.metadata.get('title', 'Archive inconnue')
            context_parts.append(f"[Source: {source}]\n{doc.page_content}")
        
        context = "\n\n---\n\n".join(context_parts) if context_parts else "Aucun document pertinent n'a ete trouve dans les archives pour cette question."

        # 4. Recuperation dynamique de la filiere (Securise si Guest)
        program_name = "Aucune (Externe/Invite)"
        if current_user.id != 0 and current_user.program_id:
            program_name = db.query(Program.name).filter(Program.id == current_user.program_id).scalar() or "Big Data"

        # 5. Construction du System Prompt avec les regles d'or
        system_instructions = f"""
            {get_nora_chat_system_prompt(
                user_first_name=current_user.first_name,
                user_role=current_user.role,
                user_program_name=program_name,
                user_level=current_user.level or "L1"
            )}

            Documents archives trouves pour t'aider :
            {context}
            """

        # 6. Reconstruction de l'historique pour le modele
        messages_for_ai = [
            ("system", system_instructions)
        ]
        
        for msg in payload.history:
            role = "human" if msg.role == "user" else "assistant"
            messages_for_ai.append((role, msg.content))
            
        # Ajout de la question actuelle de l'etudiant
        messages_for_ai.append(("human", payload.query))

        # 7. Execution unique sur Groq
        response = llm.invoke(messages_for_ai)
        ai_answer = response.content
        
        # 8. Sauvegarde du Log 100% Anonymise
        academic_year_label = None
        
        if current_user.id != 0:
            try:
                if hasattr(current_user, 'academic_year') and current_user.academic_year:
                    academic_year_label = current_user.academic_year.label
            except Exception:
                academic_year_label = None

        log_anonyme = ConversationLog(
            chat_id=payload.chat_id,
            user_prompt=payload.query,
            ai_response=ai_answer,
            user_role=current_user.role,
            user_level=current_user.level if current_user.id != 0 else "Guest",
            program_name=program_name if current_user.id != 0 else "Guest",
            academic_year_label=academic_year_label
        )
        
        db.add(log_anonyme)
        db.commit()
        
        return {
            "answer": ai_answer,
            "sources": sources
        }
        
    except Exception as e:
        print(f"Erreur detectee dans /chatbot/ask : {e}")
        return {
            "answer": "Je n'arrive pas a fouiller dans mes dossiers pour le moment. Une erreur technique est survenue.",
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

    # On capture l'ID de l'auteur avant de lancer le thread
    author_id = project.owner_id

    # On définit la logique de téléchargement + traitement
    def full_ingestion_flow():
        if download_pdf(project.report_pdf_url, local_pdf):
            process_pdf_logic(local_pdf, metadata={
                "project_id": project_id,
                "title": project.title,
                "author": author_id  # Modification ici
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
        
        # 1. Instanciation du splitter avec ses configurations
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )
        
        # 2. Appel de la methode sur l'instance creee
        chunks = text_splitter.split_documents(documents)
        
        # On recupere le nom propre une seule fois avant la boucle
        clean_name = metadata.get('title') or metadata.get('source') or "Document"
        
        # 3. Injection des metadata dans CHAQUE chunk
        for chunk in chunks:
            chunk.metadata.update(metadata)
            chunk.metadata["title"] = clean_name  # Inclus dans la boucle
            chunk.metadata["source"] = clean_name # Inclus dans la boucle
            
        # 4. Initialiser la DB et ajouter les documents
        vector_db = Chroma.from_documents(
            documents=chunks, 
            embedding=embeddings, 
            persist_directory=CHROMA_PATH
        )
        print("Enregistrement dans ChromaDB effectue avec succes.")
        
    except Exception as e:
        print(f"❌ Erreur lors du process_pdf: {e}")
    finally:
        # Nettoyage systematique du fichier temporaire
        if os.path.exists(file_path):
            os.remove(file_path)
            print(f"🗑️ Nettoyage : {file_path} supprime.")

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
    
@router.post("/chatbot/feedback")
async def save_chatbot_feedback(payload: FeedbackPayload, db: Session = Depends(get_db)):
    """
    Enregistre le feedback de l'utilisateur sur le dernier message de la session.
    """
    try:
        # Récupération de la dernière interaction de ce chat_id
        last_log = db.query(ConversationLog).filter(
            ConversationLog.chat_id == payload.chat_id
        ).order_by(ConversationLog.id.desc()).first()
        
        if last_log:
            # 🟢 On utilise le vrai champ de ta BDD ici !
            last_log.has_negative_feedback = payload.has_negative_feedback
            
            db.commit()
            return {"status": "success", "message": "Feedback enregistré avec succès"}
        
        return {"status": "ignored", "message": "Chat ID introuvable pour ce feedback"}
        
    except Exception as e:
        db.rollback()
        print(f"❌ Erreur lors de l'enregistrement du feedback : {e}")
        raise HTTPException(status_code=500, detail="Impossible d'enregistrer le feedback")