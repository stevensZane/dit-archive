import os
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from github import Github
from database import *
from auth_utils import *
from services import *
from auth_utils import *
from pydantic_models import *
from cloudinary_utils import upload_to_cloudinary

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
    github_url: str = Form(None),
    report_file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role("admin")) # Sécurité RBAC
):
    # 1. Validation rapide des IDs
    if not db.query(Program).filter(Program.id == program_id).first():
        raise HTTPException(status_code=404, detail="Filière non reconnue")
    
    # 2. Upload direct du PDF sur Cloudinary (Comme pour les étudiants)
    pdf_url = upload_to_cloudinary(report_file.file, folder="projects/historical_reports")
    if not pdf_url:
        raise HTTPException(status_code=500, detail="Échec de l'upload du rapport")

    # 3. Création du projet "Fantôme" (Pas d'owner_id)
    new_project = Project(
        title=title,
        author_name=author_name, # Stocké directement pour les anciens
        description=f"Projet historique de {author_name} - Archivage Admin.",
        github_repository_url=github_url,
        report_pdf_url=pdf_url,
        screenshots=None, # Pas de photos pour l'historique comme convenu
        academic_year_id=academic_year_id,
        program_id=program_id,
        level=level,
        owner_id=None, # Important : aucun compte utilisateur lié
        is_historical=True,
        analysis_status="pending",
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

    # 4. Si GitHub est présent, on lance l'analyse auto des technos
    if github_url:
        background_tasks.add_task(process_and_archive_project, new_project.id)

    return {
        "status": "success",
        "message": f"Archive de '{author_name}' créée.",
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

# --- 3. INITIALISATION METADATA (Base vide) ---
@router.post("/init-metadata")
def init_database_metadata(data: MetadataInit, db: Session = Depends(get_db)):
    # Ajout des Technologies
    for tech_name in data.technologies:
        if not db.query(Technology).filter(Technology.name == tech_name).first():
            db.add(Technology(name=tech_name))
            
    # Ajout des Filières (Programs)
    for prog_name in data.programs:
        if not db.query(Program).filter(Program.name == prog_name).first():
            db.add(Program(name=prog_name))
            
    # Ajout des Années Académiques
    for year_label in data.academic_years:
        # Adapte 'display_name' selon ton modèle AcademicYear
        if not db.query(AcademicYear).filter(AcademicYear.display_name == year_label).first():
            db.add(AcademicYear(display_name=year_label))
            
    db.commit()
    return {"message": "Données de base (Technos, Filières, Années) insérées."}


@router.delete("/admin/projects/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Projet non trouvé")
    
    db.delete(project)
    db.commit()
    return {"detail": "Projet supprimé"}

# Route pour récupérer les utilisateurs actifs (dernières 15 minutes)
# @router.get("/admin/online-users")
# def get_online_users(db: Session = Depends(get_db)):
#     fifteen_minutes_ago = datetime.utcnow() - timedelta(minutes=15)
#     return db.query(User).filter(User.last_seen >= fifteen_minutes_ago).all()

@router.get("/admin/online-users")
def get_online_users(
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role("admin"))
):
    # En local, on récupère tout le monde pour tester l'affichage React
    users = db.query(User).all()
    
    return [
        {
            "id": u.id,
            "first_name": u.first_name,
            "last_name": u.last_name,
            "role": u.role
        } for u in users
    ]