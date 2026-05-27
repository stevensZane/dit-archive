import os
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func
from github import Github
from config.database import get_db
from utils.auth_utils import get_current_user, require_role, hash_password
from services.services import process_and_archive_project
from models.sql_models import User, Project, AcademicYear, Program, Like
from models.pydantic_models import AdminCreate
from utils.cloudinary_utils import upload_to_cloudinary
from datetime import timedelta, datetime
from typing import Optional

# Config GitHub
g = Github(os.getenv("GITHUB_TOKEN"))
repo = g.get_repo(os.getenv("REPO_NAME"))

router = APIRouter(
    prefix="",
    tags=["admin stuff"]
)


@router.post("/historical-upload")
async def upload_historical_project(
    background_tasks: BackgroundTasks,
    title: str = Form(...),
    author_name: str = Form(...), 
    program_id: int = Form(...),
    academic_year_id: int = Form(...),
    level: str = Form(...),
    description: Optional[str] = Form(None),
    github_url: Optional[str] = Form(None),
    report_file: Optional[UploadFile] = File(None), # Optionnel !
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role(["admin", "superadmin"]))
):
    # 1. Validation des éléments sélectionnés
    if not db.query(Program).filter(Program.id == program_id).first():
        raise HTTPException(status_code=404, detail="Filière non reconnue")
        
    if not db.query(AcademicYear).filter(AcademicYear.id == academic_year_id).first():
        raise HTTPException(status_code=404, detail="Année académique non reconnue")
    
    # 2. Gestion de l'upload conditionnel du PDF
    pdf_url = None
    if report_file and report_file.filename:
        pdf_url = upload_to_cloudinary(report_file.file, folder="projects/historical_reports")
        if not pdf_url:
            raise HTTPException(status_code=500, detail="Échec de l'upload du rapport sur Cloudinary")

    # 3. Création du projet "Fantôme" historique
    new_project = Project(
        title=title,
        author_name=author_name,
        description=description if description else f"Projet historique de {author_name} - Archivage Admin.",
        github_repository_url=github_url if github_url else None,
        report_pdf_url=pdf_url,
        screenshots=None,
        academic_year_id=academic_year_id,
        program_id=program_id,
        level=level,
        owner_id=None, 
        is_historical=True,
        # Si pas de GitHub, on le passe en "completed" direct (pas d'analyse de repo requise)
        analysis_status="pending" if github_url else "completed",
        views_count=0,
        downloads_count=0
    )

    db.add(new_project)
    
    try:
        db.commit()
        db.refresh(new_project)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erreur DB : {str(e)}")

    # 4. Analyse asynchrone uniquement si le lien GitHub est fourni
    if github_url:
        # Ton import de tâche
        background_tasks.add_task(process_and_archive_project, new_project.id)

    return {
        "status": "success",
        "message": f"Archive de '{author_name}' créée avec succès.",
        "project_id": new_project.id
    }

@router.get("/admin/stats")
def get_admin_stats(
    db: Session = Depends(get_db), 
    admin: User = Depends(require_role("admin"))
):
    # 1. Étudiant le plus actif
    top_student_query = (
        db.query(User.first_name, User.last_name)
        .join(Project, Project.owner_id == User.id)
        .filter(User.role == "student")
        .group_by(User.id)
        .order_by(func.count(Project.id).desc())
        .first()
    )
    top_student_name = f"{top_student_query.first_name} {top_student_query.last_name}" if top_student_query else "Aucun"

    # 2. Projet avec le plus de likes (Correction du bug potentiel)
    # On récupère juste le titre pour être plus léger
    most_liked_title = (
        db.query(Project.title)
        .join(Like, Like.project_id == Project.id)
        .group_by(Project.id)
        .order_by(func.count(Like.id).desc())
        .limit(1)
        .scalar() # Retourne directement la valeur (le titre) ou None
    ) or "Aucun"

    # 3. Comptes globaux (On peut grouper les comptes par rôle pour aller plus vite)
    # Mais pour rester simple et lisible, on garde tes filtres séparés
    return {
        "total_archived_projects": db.query(Project).filter(Project.analysis_status == "archived").count(),
        "completed_analysis": db.query(Project).filter(Project.analysis_status == "completed").count(),
        "students": db.query(User).filter(User.role == "student").count(),
        "admins": db.query(User).filter(User.role == "admin").count(),
        "most_liked": most_liked_title,
        "top_student": top_student_name
    }

@router.get("/admin/projects")
async def get_all_projects_admin(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Project).all()

@router.post("/admin/users", status_code=201)
def admin_create_user(
    user_in: AdminCreate, # Utilisation du modèle AdminCreate (champs académiques optionnels)
    db: Session = Depends(get_db), 
    current_admin: User = Depends(require_role("admin")) # Seul admin ou superadmin
):
    # Sécurité supplémentaire : Seul un superadmin peut créer un autre superadmin
    if user_in.role == "superadmin" and current_admin.role != "superadmin":
        raise HTTPException(status_code=403, detail="Seul un superadmin peut créer un autre superadmin")

    email_clean = user_in.email.lower().strip()
    if db.query(User).filter(User.email == email_clean).first():
        raise HTTPException(status_code=400, detail="Email déjà utilisé")

    # On utilise .dict() et on remplace le password par le hash
    user_dict = user_in.dict(exclude={"password"})
    new_user = User(
        **user_dict,
        password_hash=hash_password(user_in.password)
    )
    
    db.add(new_user)
    db.commit()
    return {"message": f"Utilisateur avec le rôle {user_in.role} créé avec succès"}


@router.delete("/admin/projects/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Projet non trouvé")
    
    db.delete(project)
    db.commit()
    return {"detail": "Projet supprimé"}

@router.get("/admin/online-users")
def get_online_users(
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role("admin"))
):
    # 1. Definition du seuil d'activite (ex: actif ces 5 dernieres minutes)
    minutes_threshold = 5
    now = datetime.utcnow()
    
    # Recupere tous les utilisateurs qui ont une valeur dans 'last_seen'
    all_users = db.query(User).filter(User.last_seen.isnot(None)).all()
    
    online_users_list = []
    
    # Initialisation des compteurs pour les statistiques globales
    stats = {
        "total_student_online": 0,
        "total_admin_online": 0,
        "total_superadmin_online": 0,
        "total_guest_online": 0
    }
    
    for u in all_users:
        try:
            # Conversion de la string 'last_seen' en objet datetime Python
            user_time = datetime.fromisoformat(u.last_seen)
            
            # Si l'utilisateur a ete vu dans la fenetre des 5 dernieres minutes
            if now - user_time <= timedelta(minutes=minutes_threshold):
                
                # Incrementer les statistiques selon le role
                if u.role == "student":
                    stats["total_student_online"] += 1
                elif u.role == "admin":
                    stats["total_admin_online"] += 1
                elif u.role == "superadmin":
                    stats["total_superadmin_online"] += 1
                elif u.role == "guest":
                    stats["total_guest_online"] += 1
                
                # Pour la liste detaillee, on ignore les guests (comme demande)
                if u.role != "guest":
                    online_users_list.append({
                        "id": u.id,
                        "first_name": u.first_name,
                        "last_name": u.last_name,
                        "role": u.role,
                        "last_seen": u.last_seen
                    })
                    
        except ValueError:
            # Securite au cas ou une string mal formee soit en BDD
            continue

    # 2. Retourner les donnees structurees pour le frontend React
    return {
        "stats": stats,
        "online_users": online_users_list
    }


@router.post("/admin/sync-old-points")
def sync_old_points(db: Session = Depends(get_db)):
    # 1. On récupère tous les utilisateurs
    users = db.query(User).all()
    
    for user in users:
        # On compte ses projets
        projects = db.query(Project).filter(Project.owner_id == user.id).all()
        user.project_count = len(projects)
        
        # On calcule les points de ses projets
        total_points_projets = 0
        for p in projects:
            base_score = p.nora_score if p.nora_score else 50
            # On applique les bonus de type
            bonus = 2
            if p.project_type == "personal" or p.project_type == "group":
                bonus = 3
            elif p.project_type == "final_year":
                bonus = 4
            total_points_projets += (base_score + bonus)
            
        # On applique le calcul des points
        user.total_points = total_points_projets
        user.monthly_points = total_points_projets  # Pour le premier mois
        
        # On lui attribue son rank_title de départ
        if user.total_points >= 1600:
            user.rank_title = "Singularity Overlord"
        elif user.total_points >= 900:
            user.rank_title = "Predictive Nexus"
        elif user.total_points >= 400:
            user.rank_title = "Neural Architect"
        elif user.total_points >= 100:
            user.rank_title = "Model Optimizer"
        else:
            user.rank_title = "Prompt Apprentice"

    db.commit()
    return {"message": "Toutes les anciennes données ont été synchronisées avec succès !"}