import os
import shutil
import requests
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, UploadFile, File, Query
from sqlalchemy.orm import Session
from sqlalchemy import text

from langchain_community.vectorstores import PGVector
from langchain_groq import ChatGroq
from langchain_nomic import NomicEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyMuPDFLoader
from langchain_core.documents import Document

from config.database import get_db
from models.sql_models import User, Program, ConversationLog, Project
from models.pydantic_models import ChatPayload, FeedbackPayload
from utils.auth_utils import get_current_user
from config.system_prompts import get_nora_chat_system_prompt

router = APIRouter(
    prefix="",
    tags=["nora"]
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

DATABASE_URL = os.getenv("DATABASE_URL")
COLLECTION_PDF = "nora_knowledge"  # Unique source de vérité désormais

@router.post("/chatbot/ask")
async def ask_nora(payload: ChatPayload, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    sources = []
    try:
        # Initialisation unique du store basé sur les projets (PDFs)
        pdf_vector_db = PGVector(
            connection_string=DATABASE_URL,
            embedding_function=embeddings,
            collection_name=COLLECTION_PDF,
            use_jsonb=True
        )
        
        project_id_filter = getattr(payload, "project_id", None)
        filtered_docs = []
        
        if project_id_filter:
            # CAS A : Discussion ciblée dans la page d'un projet spécifique
            search_kwargs = {"k": 5, "filter": {"project_id": int(project_id_filter)}}
            filtered_docs = pdf_vector_db.similarity_search(payload.query, **search_kwargs)
        else:
            # CAS B : Recherche globale dans la bibliothèque de projets
            try:
                filtered_docs = pdf_vector_db.similarity_search(payload.query, k=6)
            except Exception:
                filtered_docs = []
        
        # 2. Extraction des sources uniques (Rapports de projets)
        seen_titles = set()
        for doc in filtered_docs:
            title = doc.metadata.get('title', 'Projet Archive')
            url = doc.metadata.get('pdf_url') or doc.metadata.get('url')
            if title not in seen_titles:
                sources.append({"title": title, "url": url})
                seen_titles.add(title)
        
        # 3. Préparation du contexte des projets pour le LLM
        context_parts = []
        for doc in filtered_docs:
            source = doc.metadata.get('title', 'Rapport Inconnu')
            context_parts.append(f"[Projet Source: {source}]\n{doc.page_content}")
        
        context = "\n\n---\n\n".join(context_parts) if context_parts else "Aucun projet ou livrable correspondant n'a été trouvé dans mes archives."

        # 4. Récupération dynamique de la filière de l'utilisateur
        program_name = "Externe/Invité"
        if current_user.id != 0 and current_user.program_id:
            program_name = db.query(Program.name).filter(Program.id == current_user.program_id).scalar() or "Informatique"

        # 5. System Prompt stricte axé sur l'analyse technique des projets
        system_instructions = f"""
            {get_nora_chat_system_prompt(
                user_first_name=current_user.first_name,
                user_role=current_user.role,
                user_program_name=program_name,
                user_level=current_user.level or "L1"
            )}

            MISSION CRITIQUE : Tu es Nora, l'IA archiviste de la bibliothèque de projets du DIT. Ton unique rôle est de répondre aux questions sur les travaux de recherche, rapports, implémentations techniques, codes sources et concepts abordés dans les projets archivés.
            Si la demande de l'utilisateur ne concerne pas un projet ou un domaine d'ingénierie/développement lié aux archives, recadre poliment en rappelant ta fonction de guide de la bibliothèque.

            Contexte extrait des rapports de projets pertinents :
            {context}
            """

        # 6. Reconstruction de l'historique de discussion
        messages_for_ai = [("system", system_instructions)]
        for msg in payload.history:
            role = "human" if msg.role == "user" else "assistant"
            messages_for_ai.append((role, msg.content))
            
        messages_for_ai.append(("human", payload.query))

        # 7. Appel à Groq
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
            "answer": "Je rencontre des difficultés pour analyser mes archives de projets pour le moment.",
            "sources": sources
        }

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
                "author": author_id,
                "pdf_url": project.report_pdf_url
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
        print("Enregistrement du rapport de projet effectué avec succès.")
        
    except Exception as e:
        print(f"Erreur lors du process_pdf: {e}")
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

@router.get("/chatbot/documents")
async def list_nora_documents(db: Session = Depends(get_db)):
    """Récupère proprement la liste des rapports de projets stockés dans pgvector."""
    try:
        query = text("""
            SELECT DISTINCT 
                COALESCE(cmetadata->>'title', 'Rapport de Projet') as name,
                COALESCE(cmetadata->>'source', 'Inconnu') as src_type
            FROM langchain_pg_embedding;
        """)
        result = db.execute(query).fetchall()
        
        unique_docs = []
        for row in result:
            unique_docs.append({
                "id": row.name,
                "name": row.name,
                "created_at": "Document PDF / Rapport"
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
        return {"message": f"Le projet {doc_name} a été retiré de la mémoire de Nora."}
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

def trigger_nora_ingestion_for_project(project_id: int, db: Session):
    """
    Fonction utilitaire pour déclencher l'apprentissage
    automatique d'un projet par Nora.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project or not project.report_pdf_url:
        return False

    os.makedirs("temp_storage", exist_ok=True)
    local_pdf = f"temp_storage/project_{project_id}.pdf"
    author_id = project.owner_id

    if download_pdf(project.report_pdf_url, local_pdf):
        process_pdf_logic(
            local_pdf,
            metadata={
                "project_id": project_id,
                "title": project.title,
                "author": author_id,
                "pdf_url": project.report_pdf_url,
            },
        )
        if os.path.exists(local_pdf):
            os.remove(local_pdf)
        return True

    return False