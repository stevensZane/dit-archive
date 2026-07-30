import os
import csv
import io
import hashlib
from sqlalchemy.orm import Session
from config.database import SessionLocal
from models.sql_models import ConversationLog, Project, ExternalDataset
from utils.cloudinary_utils import upload_to_cloudinary

def hash_id(val: int) -> str:
    """Anonymise les IDs d'utilisateurs/chats."""
    return hashlib.sha256(f"dit_salt_{val}".encode()).hexdigest()[:10]

def generate_nlp_dataset(db: Session) -> tuple[io.BytesIO, int]:
    """Extrait les logs anonymisés de Nora pour un dataset NLP."""
    logs = db.query(ConversationLog).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow([
        "session_hash", "user_role", "user_level", 
        "program_name", "detected_language", "category_topic", 
        "user_prompt", "ai_response", "has_negative_feedback"
    ])
    
    for log in logs:
        writer.writerow([
            hash_id(log.id),
            log.user_role or "guest",
            log.user_level or "N/A",
            log.program_name or "N/A",
            log.detected_language or "fr",
            log.category_topic or "Général",
            log.user_prompt.replace("\n", " ") if log.user_prompt else "",
            log.ai_response.replace("\n", " ") if log.ai_response else "",
            log.has_negative_feedback
        ])
    
    csv_bytes = io.BytesIO(output.getvalue().encode('utf-8'))
    return csv_bytes, len(logs)

def generate_projects_dataset(db: Session) -> tuple[io.BytesIO, int]:
    """Extrait les métadonnées des projets pour de l'analyse EDA & Tech Trends."""
    projects = db.query(Project).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow([
        "project_id_hash", "project_type", "level", 
        "primary_language", "technologies_list", 
        "views_count", "downloads_count", "nora_score"
    ])
    
    for p in projects:
        writer.writerow([
            hash_id(p.id),
            p.project_type or "academic",
            p.level or "N/A",
            p.primary_language or "Non spécifié",
            p.technologies_list or "",
            p.views_count or 0,
            p.downloads_count or 0,
            p.nora_score or 0.0
        ])
    
    csv_bytes = io.BytesIO(output.getvalue().encode('utf-8'))
    return csv_bytes, len(projects)

def create_or_update_dataset(
    db: Session, 
    title: str, 
    description: str, 
    category: str, 
    size_label: str, 
    rows_label: str, 
    source_name: str, 
    url: str, 
    public_id: str
):
    """Met à jour le dataset en BDD s'il existe déjà, sinon le crée."""
    existing = db.query(ExternalDataset).filter(ExternalDataset.title == title).first()
    
    if existing:
        existing.description = description
        existing.size_label = size_label
        existing.rows_label = rows_label
        existing.download_url = url
        existing.cloudinary_public_id = public_id
    else:
        new_ds = ExternalDataset(
            title=title,
            description=description,
            category=category,
            format="CSV",
            size_label=size_label,
            rows_label=rows_label,
            source_name=source_name,
            download_url=url,
            cloudinary_public_id=public_id,
            license="Open Data (CC BY 4.0)",
            is_verified=True
        )
        db.add(new_ds)

def sync_dataplace_datasets():
    """Fonction principale de synchronisation appelée par FastAPI ou le bouton Admin."""
    db: Session = SessionLocal()
    print("🚀 Début de la synchronisation des datasets pour la Dataplace...")

    try:
        # 1. DATASET NLP
        csv_file, row_count = generate_nlp_dataset(db)
        file_size_mb = round(csv_file.getbuffer().nbytes / (1024 * 1024), 2)
        
        res_cloudinary = upload_to_cloudinary(csv_file, folder="dit_datasets")
        url_nlp = res_cloudinary.get("url") if isinstance(res_cloudinary, dict) else None
        public_id_nlp = res_cloudinary.get("public_id") if isinstance(res_cloudinary, dict) else None

        if url_nlp:
            create_or_update_dataset(
                db=db,
                title="DIT AI Assistant Logs & Intent Classification",
                description="Jeu de données anonymisé des interactions avec l'IA Nora. Idéal pour l'analyse de sentiment, la classification d'intentions et le traitement du langage naturel (NLP).",
                category="NLP & IA Vocale",
                size_label=f"{file_size_mb if file_size_mb > 0 else '< 1'} MB",
                rows_label=f"{row_count} lignes",
                source_name="DIT Community Analytics",
                url=url_nlp,
                public_id=public_id_nlp
            )

        # 2. DATASET EDA
        csv_file_proj, row_count_proj = generate_projects_dataset(db)
        file_size_proj_mb = round(csv_file_proj.getbuffer().nbytes / (1024 * 1024), 2)

        res_cloudinary_proj = upload_to_cloudinary(csv_file_proj, folder="dit_datasets")
        url_proj = res_cloudinary_proj.get("url") if isinstance(res_cloudinary_proj, dict) else None
        public_id_proj = res_cloudinary_proj.get("public_id") if isinstance(res_cloudinary_proj, dict) else None

        if url_proj:
            create_or_update_dataset(
                db=db,
                title="DIT Academic Tech Radar & Project Scoring",
                description="Métadonnées d'analyse des projets académiques soumis par les étudiants. Permet d'analyser l'évolution des technologies utilisées par filière et prédire l'engagement des projets.",
                category="Analyse de Données & EDA",
                size_label=f"{file_size_proj_mb if file_size_proj_mb > 0 else '< 1'} MB",
                rows_label=f"{row_count_proj} lignes",
                source_name="DIT Lab Archives",
                url=url_proj,
                public_id=public_id_proj
            )

        db.commit()
        print("✅ Datasets de la Dataplace synchronisés avec succès !")
        return True, "Datasets synchronisés avec succès !"

    except Exception as e:
        db.rollback()
        print(f"❌ Erreur lors de la synchronisation : {str(e)}")
        return False, str(e)
    finally:
        db.close()

if __name__ == "__main__":
    sync_dataplace_datasets()