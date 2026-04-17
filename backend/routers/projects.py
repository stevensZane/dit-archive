import os
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from github import Github
from typing import Optional, List
from database import *
from auth_utils import *
from services import *
from auth_utils import get_current_user
from fastapi.responses import RedirectResponse
import os
from ai import call_groq_api
from cloudinary_utils import *

# Config GitHub
g = Github(os.getenv("GITHUB_TOKEN"))
repo = g.get_repo(os.getenv("REPO_NAME"))

router = APIRouter(
    prefix="",
    tags=["projects"]
)


@router.post("/upload")
async def create_new_project(
    background_tasks: BackgroundTasks,
    title: str = Form(...),
    description: str = Form(...),
    github_url: str = Form(None),
    academic_year_id: int = Form(...),
    program_id: int = Form(...),
    level: str = Form(...),
    report_pdf: UploadFile = File(...), # Obligatoire
    screenshot_files: List[UploadFile] = File(None), # Optionnel, plusieurs fichiers
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # 1. Upload du PDF sur Cloudinary
    pdf_url = upload_to_cloudinary(report_pdf.file, folder="projects/reports")
    
    # 2. Upload des Screenshots (Boucle sur la liste)
    screenshot_urls = []
    if screenshot_files:
        for img in screenshot_files:
            url = upload_to_cloudinary(img.file, folder="projects/screenshots")
            if url:
                screenshot_urls.append(url)
    
    # On transforme la liste en chaîne séparée par des virgules pour notre champ Text
    screenshots_str = ",".join(screenshot_urls) if screenshot_urls else None

    # 3. Création de l'entrée en Base de Données
    new_project = Project(
        title=title,
        description=description,
        github_repository_url=github_url,
        report_pdf_url=pdf_url,
        screenshots=screenshots_str,
        academic_year_id=academic_year_id,
        program_id=program_id,
        level=level,
        owner_id=current_user.id,
        # On initialise les statuts pour Nora
        analysis_status="pending",
        views_count=0,
        downloads_count=0
    )

    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    
    # 3. On lance l'analyse GitHub en tâche de fond
    # L'utilisateur reçoit sa réponse alors que Nora commence son job
    if github_url:
        background_tasks.add_task(process_and_archive_project, new_project.id)

    return {
        "message": "Projet créé avec succès !",
        "project_id": new_project.id,
        "pdf_url": pdf_url
    }


@router.get("/projects/search")
def search_projects(
    q: str = Query(None), 
    db: Session = Depends(get_db)
):
    # On autorise la recherche dès 1 caractère si tu veux, 
    # mais attention aux performances. Ici on garde 2.
    if not q or len(q) < 2:
        return []

    search_term = f"%{q}%"

    # On commence la requête sur Project
    # On fait un join simple sur User (Auteur)
    query = db.query(Project).join(User, Project.owner_id == User.id, isouter=True)

    # Construction du filtre
    # Pour les technologies, on utilise .any() c'est beaucoup plus robuste
    conditions = [
        Project.title.ilike(search_term),
        Project.description.ilike(search_term),
        User.first_name.ilike(search_term),
        User.last_name.ilike(search_term),
        Project.technologies.any(Technology.name.ilike(search_term)) # <--- LA CLÉ
    ]

    results = query.filter(
        # Project.status == "approved", # À décommenter plus tard
        or_(*conditions)
    ).distinct().all()

    return [{
        "id": p.id,
        "title": p.title,
        "author": f"{p.owner.first_name} {p.owner.last_name}" if p.owner else "DIT",
        "program": p.program.name if p.program else "N/A",
        "technologies": [t.name for t in p.technologies]
    } for p in results]

@router.get("/projects/me")
def get_my_projects(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # On récupère les projets de l'utilisateur connecté
    projects = db.query(Project).filter(Project.owner_id == current_user.id).all()
    
    results = []
    for p in projects:
        results.append({
            "id": p.id, 
            "title": p.title,
            "status": p.status, # CRUCIAL pour l'affichage des badges (archived/pending)
            "technologies_list": p.technologies_list, # La string scanée par Nora
            "program": {
                "name": p.program.name if p.program else "N/A"
            },
            "academic_year": {
                "label": p.academic_year.label if p.academic_year else "N/A"
            },
            # On s'assure d'utiliser le bon nom de colonne pour l'URL
            "github_repository_url": p.github_repository_url 
        })
    
    return results

@router.get("/projects/{project_id}/report")
async def get_project_report(project_id: int, db: Session = Depends(get_db)):
    # 1. Récupération du projet en base
    project = db.query(Project).filter(Project.id == project_id).first()

    # 2. Validation : Le projet existe-t-il et a-t-il un PDF ?
    if not project:
        raise HTTPException(
            status_code=404, 
            detail="Projet non trouvé."
        )
    
    if not project.report_pdf_url:
        raise HTTPException(
            status_code=404, 
            detail="Ce projet n'a pas encore de rapport PDF archivé."
        )

    # 3. Logique Cloudinary
    # Puisque 'report_pdf_url' contient déjà l'URL complète (https://res.cloudinary.com/...)
    # On fait une redirection 307 (Temporary Redirect)
    # Cela permet au navigateur d'ouvrir directement le lien Cloudinary
    
    print(f"[DEBUG] Redirection vers le rapport : {project.report_pdf_url}")
    
    return RedirectResponse(url=project.report_pdf_url)

@router.get("/projects/{project_id}")
def get_project(project_id: int, db: Session = Depends(get_db)):
    # On utilise joinedload pour "forcer" la récupération des relations en une seule requête SQL
    project = db.query(Project)\
        .options(
            joinedload(Project.owner),
            joinedload(Project.academic_year),
            joinedload(Project.program),
            joinedload(Project.technologies) # Si tu as une table de jointure pour la stack
        )\
        .filter(Project.id == project_id)\
        .first()

    if not project:
        raise HTTPException(status_code=404, detail="Projet non trouvé")
    
    return project

@router.get("/projects")
def get_all_projects(
    program_id: Optional[int] = Query(None),
    year_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    # On utilise .joinedload() pour que SQLAlchemy récupère les infos liées en UNE SEULE requête
    # C'est beaucoup plus rapide pour ton API
    from sqlalchemy.orm import joinedload
    
    query = db.query(Project).options(
        joinedload(Project.program),
        joinedload(Project.academic_year),
        joinedload(Project.owner),
        joinedload(Project.technologies)
    )

    if program_id:
        query = query.filter(Project.program_id == program_id)
    if year_id:
        query = query.filter(Project.academic_year_id == year_id)
    
    # On ne montre que ce qui est archivé/approuvé sur l'Explore
    query = query.filter(Project.status.in_(["archived", "approved"]))
    
    projects = query.order_by(Project.created_at.desc()).all()

    # Transformation pour ajouter le compteur de likes
    # (Tu peux aussi le faire via une subquery SQL pour plus de perfs)
    for p in projects:
        p.likes_count = len(p.likes)
        
    return projects

@router.post("/projects/{project_id}/like")
def toggle_like(
    project_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # Chercher si le like existe déjà
    existing_like = db.query(Like).filter(
        Like.project_id == project_id, 
        Like.user_id == current_user.id
    ).first()

    if existing_like:
        # Si existe, on le retire (Unlike)
        db.delete(existing_like)
        db.commit()
        return {"message": "Unliked", "liked": False}
    else:
        # Sinon, on le crée (Like)
        new_like = Like(project_id=project_id, user_id=current_user.id)
        db.add(new_like)
        db.commit()
        return {"message": "Liked", "liked": True}
    

@router.get("/projects/{project_id}/ai-summary")
async def get_project_ai_summary(project_id: int, db: Session = Depends(get_db)):
    project = db.get(Project, project_id)
    
    # 1. Vérifie si on a déjà un résumé en base pour économiser des jetons API
    if project.ai_summary:
        return {"summary": project.ai_summary}

    # 2. Prépare les données pour Groq
    content_to_analyze = f"""
    Titre: {project.title}
    Description: {project.description}
    README: {project.readme_content}
    Technologies: {project.technologies_list}
    """

    # 3. Appelle ton service Groq avec un "System Prompt" spécial Résumé
    try:
        summary = await call_groq_api(
            system_prompt="""
                Tu es Nora, l'IA de la bibliothèque DIT.
                Ton rôle est de faire un résumé technique, inspirant et structuré du 
                projet suivant en 4-5 phrases maximum.
                
                Tu utilises seulement le contenu du readme, n'inventes rien. 
                Si le readme est anglais comprends le et traduits le.
                
                Génère un résumé structuré en Markdown professionnel, avec des sections 
                hiérarchisées (##, ###), des listes à puces, et une mise en forme claire ; 
                mets en évidence les technologies et outils avec du gras et du code, ajoute des 
                blocs de code si pertinent, et assure une présentation concise, lisible et 
                visuellement agréable (type documentation moderne).
                
                Ne retourne que du Markdown valide, sans texte brut en dehors de la structure.
            
            """,
            user_content=content_to_analyze
        )
        
        # 4. Sauvegarde le résumé pour la prochaine fois
        project.ai_summary = summary
        db.commit()
        
        return {"summary": summary}
    except Exception as e:
        return {"summary": "Nora n'a pas pu analyser ce projet pour le moment."}