

# import os
# from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, UploadFile, File
# from sqlalchemy.orm import Session
# from sqlalchemy import text

# from langchain_community.vectorstores import PGVector
# from langchain_groq import ChatGroq
# from langchain_nomic import NomicEmbeddings

# from config.database import get_db
# from models.sql_models import User, Program, ConversationLog, Project
# from models.pydantic_models import ChatPayload, FeedbackPayload
# from utils.auth_utils import get_current_user
# from config.system_prompts import get_nora_chat_system_prompt
# from langchain_text_splitters import RecursiveCharacterTextSplitter
# from langchain_community.document_loaders import PyMuPDFLoader

# from dotenv import load_dotenv

# load_dotenv()

# import shutil
# import requests

# router = APIRouter(
#     prefix="",
#     tags=["nora stuff"]
# )

# # Configuration de Nomic
# embeddings = NomicEmbeddings(
#     model="nomic-embed-text-v1.5", 
#     nomic_api_key=os.getenv("NOMIC_API_KEY")
# )

# # Configuration de Groq avec Llama 3.3
# llm = ChatGroq(
#     temperature=0.1, 
#     model_name="llama-3.3-70b-versatile", 
#     groq_api_key=os.getenv("GROQ_API_KEY")
# )

# # Configuration PGVector
# DATABASE_URL = os.getenv("DATABASE_URL")
# COLLECTION_NAME = "nora_knowledge"

# @router.post("/chatbot/ask")
# async def ask_nora(payload: ChatPayload, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
#     sources = []
#     try:
#         # 1. Connexion à pgvector via LangChain (Avec use_jsonb=True pour éviter le warning)
#         vector_db = PGVector(
#             connection_string=DATABASE_URL,
#             embedding_function=embeddings,
#             collection_name=COLLECTION_NAME,
#             use_jsonb=True
#         )
        
#         project_id_filter = getattr(payload, "project_id", None)
#         docs_with_scores = []
        
#         if project_id_filter:
#             search_kwargs = {"k": 4, "filter": {"project_id": int(project_id_filter)}}
#             docs = vector_db.similarity_search(payload.query, **search_kwargs)
#             docs_with_scores = [(doc, 0.0) for doc in docs]
#         else:
#             raw_docs_with_scores = vector_db.similarity_search_with_score(payload.query, k=5)
#             MAX_DISTANCE_THRESHOLD = 0.6
            
#             docs_with_scores = [
#                 (doc, score) for doc, score in raw_docs_with_scores if score <= MAX_DISTANCE_THRESHOLD
#             ]
        
#         filtered_docs = [doc for doc, _ in docs_with_scores]
        
#         # 2. Extraction des sources uniques
#         seen_titles = set()
#         for doc in filtered_docs:
#             title = doc.metadata.get('title', 'Archive')
#             url = doc.metadata.get('pdf_url')
#             if title not in seen_titles:
#                 sources.append({"title": title, "url": url})
#                 seen_titles.add(title)
        
#         # 3. Préparation du contexte extrait pour le LLM
#         context_parts = []
#         for doc in filtered_docs:
#             source = doc.metadata.get('title', 'Archive inconnue')
#             context_parts.append(f"[Source: {source}]\n{doc.page_content}")
        
#         context = "\n\n---\n\n".join(context_parts) if context_parts else "Aucun document pertinent n'a ete trouve dans les archives pour cette question."

#         # 4. Récupération dynamique de la filière
#         program_name = "Aucune (Externe/Invite)"
#         if current_user.id != 0 and current_user.program_id:
#             program_name = db.query(Program.name).filter(Program.id == current_user.program_id).scalar() or "Big Data"

#         # 5. Construction du System Prompt
#         system_instructions = f"""
#             {get_nora_chat_system_prompt(
#                 user_first_name=current_user.first_name,
#                 user_role=current_user.role,
#                 user_program_name=program_name,
#                 user_level=current_user.level or "L1"
#             )}

#             Documents archives trouves pour t'aider :
#             {context}
#             """

#         # 6. Reconstruction de l'historique
#         messages_for_ai = [("system", system_instructions)]
        
#         for msg in payload.history:
#             role = "human" if msg.role == "user" else "assistant"
#             messages_for_ai.append((role, msg.content))
            
#         messages_for_ai.append(("human", payload.query))

#         # 7. Exécution unique sur Groq
#         response = llm.invoke(messages_for_ai)
#         ai_answer = response.content
        
#         # 8. Sauvegarde du Log Anonymisé
#         academic_year_label = None
#         if current_user.id != 0:
#             try:
#                 if hasattr(current_user, 'academic_year') and current_user.academic_year:
#                     academic_year_label = current_user.academic_year.label
#             except Exception:
#                 academic_year_label = None

#         log_anonyme = ConversationLog(
#             chat_id=payload.chat_id,
#             user_prompt=payload.query,
#             ai_response=ai_answer,
#             user_role=current_user.role,
#             user_level=current_user.level if current_user.id != 0 else "Guest",
#             program_name=program_name if current_user.id != 0 else "Guest",
#             academic_year_label=academic_year_label
#         )
        
#         db.add(log_anonyme)
#         db.commit()
        
#         return {
#             "answer": ai_answer,
#             "sources": sources
#         }
        
#     except Exception as e:
#         print(f"Erreur detectee dans /chatbot/ask : {e}")
#         return {
#             "answer": "Je n'arrive pas a fouiller dans mes dossiers pour le moment. Une erreur technique est survenue.",
#             "sources": sources
#         }

# @router.post("/chatbot/upload-doc")
# async def upload_document_to_nora(
#     background_tasks: BackgroundTasks, 
#     file: UploadFile = File(...)
# ):
#     os.makedirs("temp_storage", exist_ok=True)
#     file_path = f"temp_storage/{file.filename}"

#     with open(file_path, "wb") as buffer:
#         shutil.copyfileobj(file.file, buffer)

#     background_tasks.add_task(process_pdf_logic, file_path, metadata={"source": file.filename})
#     return {"message": f"Analyse de {file.filename} lancée."}

# def download_pdf(url: str, dest: str):
#     response = requests.get(url)
#     if response.status_code == 200:
#         with open(dest, "wb") as f:
#             f.write(response.content)
#         return True
#     return False

# @router.post("/chatbot/ingest/{project_id}")
# async def auto_ingest_project(project_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
#     project = db.query(Project).filter(Project.id == project_id).first()
#     if not project or not project.report_pdf_url:
#         raise HTTPException(status_code=404, detail="Projet ou PDF introuvable")

#     os.makedirs("temp_storage", exist_ok=True)
#     local_pdf = f"temp_storage/project_{project_id}.pdf"
#     author_id = project.owner_id

#     def full_ingestion_flow():
#         if download_pdf(project.report_pdf_url, local_pdf):
#             process_pdf_logic(local_pdf, metadata={
#                 "project_id": project_id,
#                 "title": project.title,
#                 "author": author_id
#             })
#             if os.path.exists(local_pdf):
#                 os.remove(local_pdf)

#     background_tasks.add_task(full_ingestion_flow)
#     return {"message": "Nora commence l'apprentissage du projet."}

# def process_pdf_logic(file_path: str, metadata: dict):
#     try:
#         loader = PyMuPDFLoader(file_path)
#         documents = loader.load()
        
#         text_splitter = RecursiveCharacterTextSplitter(
#             chunk_size=1000,
#             chunk_overlap=200
#         )
#         chunks = text_splitter.split_documents(documents)
#         clean_name = metadata.get('title') or metadata.get('source') or "Document"
        
#         for chunk in chunks:
#             chunk.metadata.update(metadata)
#             chunk.metadata["title"] = clean_name
#             chunk.metadata["source"] = clean_name
            
#         # Ajout du paramètre use_jsonb=True ici aussi lors de la création
#         PGVector.from_documents(
#             documents=chunks, 
#             embedding=embeddings, 
#             connection_string=DATABASE_URL,
#             collection_name=COLLECTION_NAME,
#             use_jsonb=True
#         )
#         print("Enregistrement dans pgvector (PostgreSQL) effectue avec succes.")
        
#     except Exception as e:
#         print(f"❌ Erreur lors du process_pdf: {e}")
#     finally:
#         if os.path.exists(file_path):
#             os.remove(file_path)
#             print(f"🗑️ Nettoyage : {file_path} supprime.")

# @router.get("/chatbot/documents")
# async def list_nora_documents(db: Session = Depends(get_db)):
#     try:
#         query = text("""
#             SELECT DISTINCT 
#                 COALESCE(cmetadata->>'title', cmetadata->>'source', 'Document inconnu') as name
#             FROM langchain_pg_embedding;
#         """)
        
#         result = db.execute(query).fetchall()
        
#         unique_docs = []
#         for row in result:
#             unique_docs.append({
#                 "id": row.name,
#                 "name": row.name,
#                 "created_at": "Archives DIT"
#             })
        
#         return unique_docs
#     except Exception as e:
#         print(f"❌ Erreur listage documents pgvector: {e}")
#         return []

# @router.delete("/chatbot/documents/{doc_name}")
# async def delete_nora_document(doc_name: str, db: Session = Depends(get_db)):
#     try:
#         query = text("""
#             DELETE FROM langchain_pg_embedding 
#             WHERE cmetadata->>'source' = :doc_name OR cmetadata->>'title' = :doc_name;
#         """)
        
#         db.execute(query, {"doc_name": doc_name})
#         db.commit()
        
#         return {"message": f"Document {doc_name} oublié par Nora avec succès."}
#     except Exception as e:
#         db.rollback()
#         raise HTTPException(status_code=500, detail=f"Erreur lors de l'oubli dans Postgres : {str(e)}")
    
# @router.post("/chatbot/feedback")
# async def save_chatbot_feedback(payload: FeedbackPayload, db: Session = Depends(get_db)):
#     try:
#         last_log = db.query(ConversationLog).filter(
#             ConversationLog.chat_id == payload.chat_id
#         ).order_by(ConversationLog.id.desc()).first()
        
#         if last_log:
#             last_log.has_negative_feedback = payload.has_negative_feedback
#             db.commit()
#             return {"status": "success", "message": "Feedback enregistré avec succès"}
        
#         return {"status": "ignored", "message": "Chat ID introuvable pour ce feedback"}
        
#     except Exception as e:
#         db.rollback()
#         print(f"❌ Erreur lors du feedback : {e}")
#         raise HTTPException(status_code=500, detail="Impossible d'enregistrer le feedback")

import os
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import text

from langchain_community.vectorstores import PGVector
from langchain_groq import ChatGroq
from langchain_nomic import NomicEmbeddings

from config.database import get_db
from models.sql_models import User, Program, ConversationLog, Project
from models.pydantic_models import ChatPayload, FeedbackPayload
from utils.auth_utils import get_current_user
from config.system_prompts import get_nora_chat_system_prompt
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyMuPDFLoader

# Importation de ton nouveau scraper
from services.scraper import DITScraper

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

# Les deux collections PostgreSQL distinctes
DATABASE_URL = os.getenv("DATABASE_URL")
COLLECTION_PDF = "nora_knowledge"
COLLECTION_WEB = "dit_website_knowledge"

@router.post("/chatbot/ask")
async def ask_nora(payload: ChatPayload, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    sources = []
    try:
        # Initialisation des deux stores distincts
        pdf_vector_db = PGVector(
            connection_string=DATABASE_URL,
            embedding_function=embeddings,
            collection_name=COLLECTION_PDF,
            use_jsonb=True
        )
        
        web_vector_db = PGVector(
            connection_string=DATABASE_URL,
            embedding_function=embeddings,
            collection_name=COLLECTION_WEB,
            use_jsonb=True
        )
        
        project_id_filter = getattr(payload, "project_id", None)
        filtered_docs = []
        
        if project_id_filter:
            # CAS A : Filtre absolu sur un projet (PDF uniquement)
            search_kwargs = {"k": 4, "filter": {"project_id": int(project_id_filter)}}
            filtered_docs = pdf_vector_db.similarity_search(payload.query, **search_kwargs)
        else:
            # CAS B : Recherche globale -> On extrait le top 4 des PDF ET le top 4 du Site Web
            # On utilise similarity_search simple pour éviter les bugs de calcul de distance
            try:
                pdf_docs = pdf_vector_db.similarity_search(payload.query, k=4)
            except Exception:
                pdf_docs = []
                
            try:
                web_docs = web_vector_db.similarity_search(payload.query, k=4)
            except Exception:
                web_docs = []
            
            # On fusionne le tout pour donner un contexte ultra-complet à Nora
            filtered_docs = pdf_docs + web_docs
        
        # 2. Extraction des sources uniques (Gère pdf_url et les URLs du site web)
        seen_titles = set()
        for doc in filtered_docs:
            title = doc.metadata.get('title', 'Archive')
            url = doc.metadata.get('url') or doc.metadata.get('pdf_url')
            if title not in seen_titles:
                sources.append({"title": title, "url": url})
                seen_titles.add(title)
        
        # 3. Préparation du contexte extrait pour le LLM
        context_parts = []
        for doc in filtered_docs:
            source = doc.metadata.get('title', 'Archive inconnue')
            context_parts.append(f"[Source: {source} | URL: {doc.metadata.get('url', '')}]\n{doc.page_content}")
        
        context = "\n\n---\n\n".join(context_parts) if context_parts else "Aucun document pertinent n'a été trouvé."

        # 4. Récupération dynamique de la filière
        program_name = "Aucune (Externe/Invité)"
        if current_user.id != 0 and current_user.program_id:
            program_name = db.query(Program.name).filter(Program.id == current_user.program_id).scalar() or "Big Data"

        # 5. Construction du System Prompt (On force Nora à lire le contexte fourni)
        system_instructions = f"""
            {get_nora_chat_system_prompt(
                user_first_name=current_user.first_name,
                user_role=current_user.role,
                user_program_name=program_name,
                user_level=current_user.level or "L1"
            )}

            CONSIGNE CRITIQUE : Tu as un accès direct aux pages récemment scrapées du site officiel du DIT ci-dessous. Reste extrêmement précis, cite les informations textuelles exactes (tarifs, rentrées, matières) et utilise les URLs fournies si l'étudiant veut en savoir plus.

            Documents et pages web du DIT trouvés dans la base de connaissances :
            {context}
            """

        # 6. Reconstruction de l'historique
        messages_for_ai = [("system", system_instructions)]
        for msg in payload.history:
            role = "human" if msg.role == "user" else "assistant"
            messages_for_ai.append((role, msg.content))
            
        messages_for_ai.append(("human", payload.query))

        # 7. Exécution unique sur Groq
        response = llm.invoke(messages_for_ai)
        ai_answer = response.content
        
        # 8. Sauvegarde du Log Anonymisé
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
        
        return {"answer": ai_answer, "sources": sources}
        
    except Exception as e:
        print(f"Erreur détectée dans /chatbot/ask : {e}")
        return {
            "answer": "Je n'arrive pas à fouiller dans mes dossiers pour le moment. Une erreur technique est survenue.",
            "sources": sources
        }

@router.post("/chatbot/sync-web")
async def sync_dit_website(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Déclenche le scraping complet et écrase l'ancienne collection web de Nora."""
    
    def sync_flow():
        try:
            # 1. Lancer le scraper de manière récursive
            scraper = DITScraper()
            scraped_pages = scraper.start_scraping_site(max_pages=30)
            
            if not scraped_pages:
                print("Aucune donnée récupérée par le scraper.")
                return

            # 2. Connexion au store LangChain pour la collection Web
            web_vector_db = PGVector(
                connection_string=DATABASE_URL,
                embedding_function=embeddings,
                collection_name=COLLECTION_WEB,
                use_jsonb=True
            )

            # Version sécurisée : On demande à LangChain de vider lui-même la collection
            try:
                web_vector_db.delete_collection()
                print(f"Ancienne collection '{COLLECTION_WEB}' vidée avec succès.")
            except Exception as e:
                print(f"ℹPas de collection à vider (première initialisation) : {e}")

            # 3. Préparer le splitter de texte
            text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=150)
            all_chunks = []

            # 4. Parcourir et découper chaque page web scrapée
            for page in scraped_pages:
                chunks = text_splitter.split_text(page["content"])
                for chunk_text in chunks:
                    from langchain_core.documents import Document
                    all_chunks.append(Document(page_content=chunk_text, metadata={
                        "title": page["title"],
                        "url": page["url"],
                        "source": "Site Web DIT"
                    }))

            # 5. Injecter l'intégralité des nouveaux chunks web dans la collection PostgreSQL
            if all_chunks:
                PGVector.from_documents(
                    documents=all_chunks,
                    embedding=embeddings,
                    connection_string=DATABASE_URL,
                    collection_name=COLLECTION_WEB,
                    use_jsonb=True
                )
                print(f"Synchronisation pgvector terminée : {len(all_chunks)} morceaux enregistrés.")
                
        except Exception as e:
            print(f"Erreur lors de la synchronisation web : {e}")

    background_tasks.add_task(sync_flow)
    return {"message": "Synchronisation du site web du DIT lancée en arrière-plan."}

@router.post("/chatbot/upload-doc")
async def upload_document_to_nora(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    os.makedirs("temp_storage", exist_ok=True)
    file_path = f"temp_storage/{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
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
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project or not project.report_pdf_url:
        raise HTTPException(status_code=404, detail="Projet ou PDF introuvable")

    os.makedirs("temp_storage", exist_ok=True)
    local_pdf = f"temp_storage/project_{project_id}.pdf"
    author_id = project.owner_id

    def full_ingestion_flow():
        if download_pdf(project.report_pdf_url, local_pdf):
            process_pdf_logic(local_pdf, metadata={
                "project_id": project_id,
                "title": project.title,
                "author": author_id
            })
            if os.path.exists(local_pdf):
                os.remove(local_pdf)

    background_tasks.add_task(full_ingestion_flow)
    return {"message": "Nora commence l'apprentissage du projet."}

def process_pdf_logic(file_path: str, metadata: dict):
    try:
        loader = PyMuPDFLoader(file_path)
        documents = loader.load()
        
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        chunks = text_splitter.split_documents(documents)
        clean_name = metadata.get('title') or metadata.get('source') or "Document"
        
        for chunk in chunks:
            chunk.metadata.update(metadata)
            chunk.metadata["title"] = clean_name
            chunk.metadata["source"] = clean_name
            
        PGVector.from_documents(
            documents=chunks, 
            embedding=embeddings, 
            connection_string=DATABASE_URL,
            collection_name=COLLECTION_PDF,
            use_jsonb=True
        )
        print("Enregistrement du PDF dans pgvector effectué avec succès.")
        
    except Exception as e:
        print(f"Erreur lors du process_pdf: {e}")
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

@router.get("/chatbot/documents")
async def list_nora_documents(db: Session = Depends(get_db)):
    """Récupère proprement la liste des documents PDF et des pages Web stockés dans pgvector."""
    try:
        # On récupère directement les titres et les sources stockés par LangChain dans le JSONB cmetadata
        query = text("""
            SELECT DISTINCT 
                COALESCE(cmetadata->>'title', 'Page Web ou Document') as name,
                COALESCE(cmetadata->>'source', 'Inconnue') as src_type
            FROM langchain_pg_embedding;
        """)
        result = db.execute(query).fetchall()
        
        unique_docs = []
        for row in result:
            is_web = row.src_type == "Site Web DIT"
            unique_docs.append({
                "id": row.name,
                "name": row.name,
                "created_at": "Site Internet (dit.sn)" if is_web else "Document PDF"
            })
        return unique_docs
    except Exception as e:
        print(f"Erreur lors du listage des documents: {e}")
        return []

@router.delete("/chatbot/documents/{doc_name}")
async def delete_nora_document(doc_name: str, db: Session = Depends(get_db)):
    try:
        query = text("""
            DELETE FROM langchain_pg_embedding 
            WHERE cmetadata->>'source' = :doc_name OR cmetadata->>'title' = :doc_name;
        """)
        db.execute(query, {"doc_name": doc_name})
        db.commit()
        return {"message": f"Élément {doc_name} oublié par Nora."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chatbot/feedback")
async def save_chatbot_feedback(payload: FeedbackPayload, db: Session = Depends(get_db)):
    try:
        last_log = db.query(ConversationLog).filter(ConversationLog.chat_id == payload.chat_id).order_by(ConversationLog.id.desc()).first()
        if last_log:
            last_log.has_negative_feedback = payload.has_negative_feedback
            db.commit()
            return {"status": "success"}
        return {"status": "ignored"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))