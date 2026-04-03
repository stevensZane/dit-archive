import os
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func
import shutil
import uuid
from github import Github
from database import *
from auth_utils import *
from services import *
from auth_utils import *

from auth_utils import get_current_user

# Config GitHub
g = Github(os.getenv("GITHUB_TOKEN"))
repo = g.get_repo(os.getenv("REPO_NAME"))

router = APIRouter(
    prefix="",
    tags=["admin stuff"]
)


@router.post("/admin/historical-upload")
async def upload_historical_project(
    background_tasks: BackgroundTasks,
    title: str = Form(...),
    author_name: str = Form(...), # Nom de l'ancien étudiant (ex: "Awa Diop")
    program_id: int = Form(...),
    year_id: int = Form(...),
    level: str = Form(...),
    github_url: str = Form(None), # Optionnel pour le passé
    report_file: UploadFile = File(...), # Obligatoire : le PDF est la mémoire du projet
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Sécurité : Seuls les admins peuvent ressusciter le passé
    if current_user.role not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs")

    # 2. Validation de la filière et de l'année
    program = db.query(Program).filter(Program.id == program_id).first()
    year = db.query(AcademicYear).filter(AcademicYear.id == year_id).first()
    
    if not program or not year:
        raise HTTPException(status_code=404, detail="Données académiques introuvables")

    # 3. Création de l'entrée "Historique"
    # Note : owner_id est mis à None car l'étudiant n'est plus dans le système
    new_project = Project(
        title=title,
        author_name=author_name, 
        github_repository_url=github_url,
        program_id=program_id,
        academic_year_id=year_id,
        level=level,
        is_historical=True, # Marqueur pour l'interface
        upload_method="historical_admin",
        status="pending"
    )
    
    db.add(new_project)
    db.commit()
    db.refresh(new_project)

    # 4. Sauvegarde temporaire du PDF
    os.makedirs("temp_uploads", exist_ok=True)
    temp_pdf_path = f"temp_uploads/hist_{new_project.id}_{uuid.uuid4().hex}.pdf"
    
    with open(temp_pdf_path, "wb") as buffer:
        shutil.copyfileobj(report_file.file, buffer)

    # 5. Lancement du worker (Le PDF part sur GitHub)
    # Le worker va aussi mettre à jour 'report_pdf_url' une fois envoyé
    background_tasks.add_task(
        process_and_archive_project,
        project_id=new_project.id,
        db=db,
        repo=repo, # Instance GitHub
        pdf_path=temp_pdf_path,
        zip_path=None, # Pas de code source à nettoyer ici
        git_url=None
    )

    return {
        "status": "success",
        "message": f"Archive historique de '{author_name}' enregistrée avec succès.",
        "project_id": new_project.id
    }

@router.get("/admin/stats")
def get_admin_stats(db: Session = Depends(get_db), admin: User = Depends(require_role("admin"))):

    top_student = (
        db.query(User.first_name)
        .join(Project, Project.owner_id == User.id)
        .filter(User.role == "student")
        .group_by(User.id)
        .order_by(func.count(Project.id).desc())
        .first()
    )

    most_liked = (
        db.query(Project)
        .join(Like, Like.project_id == Project.id)
        .group_by(Project.id)
        .order_by(func.count(Like.id).desc())
        .first()
    )

    return {
        "pending_projects": db.query(Project).filter(Project.status == "pending").count(),
        "total_archived_projects": db.query(Project).filter(Project.status == "archived").count(),
        "students": db.query(User).filter(User.role == "student").count(),
        "admins": db.query(User).filter(User.role == "admin").count(),
        "most_liked": most_liked.title if most_liked else "N/A",
        "top_student": top_student[0] if top_student else "N/A"
    }

@router.get("/admin/projects")
async def get_all_projects_admin(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Project).all()