import os
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from github import Github
import shutil
import uuid
import requests
from fastapi.responses import StreamingResponse
from io import BytesIO
from typing import Optional
from database import *
from auth_utils import *
from services import *
from auth_utils import get_current_user
from urllib.parse import quote
from fastapi.responses import StreamingResponse
from io import BytesIO
import requests
import os
from urllib.parse import unquote, quote
from ai import call_groq_api

# Config GitHub
g = Github(os.getenv("GITHUB_TOKEN"))
repo = g.get_repo(os.getenv("REPO_NAME"))

router = APIRouter(
    prefix="",
    tags=["projects"]
)

@router.post("/upload")
async def upload_project(
    background_tasks: BackgroundTasks,
    title: str = Form(...),
    description: str = Form(None),
    github_url: str = Form(...),
    program_id: int = Form(...),
    year_id: int = Form(...),
    level: str = Form(...),
    report_file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Validations
    if "github.com" not in github_url:
        raise HTTPException(status_code=400, detail="Lien GitHub invalide")
    
    clean_git_url = github_url.split("/tree/")[0].strip().rstrip("/")
    

    # 2. Création Projet
    new_project = Project(
        title=title,
        description=description,
        github_repository_url=clean_git_url,
        program_id=program_id,
        academic_year_id=year_id,
        level=level,
        owner_id=current_user.id,
        upload_method="github",
        status="pending"
    )
    
    db.add(new_project)
    db.commit()
    db.refresh(new_project)

    # 3. Sauvegarde temporaire du PDF
    os.makedirs("temp_uploads", exist_ok=True)
    temp_pdf_path = f"temp_uploads/report_{new_project.id}_{uuid.uuid4().hex[:8]}.pdf"
    with open(temp_pdf_path, "wb") as buffer:
        shutil.copyfileobj(report_file.file, buffer)

    # 4. Lancement du worker (Le nouveau worker léger sans clonage)
    background_tasks.add_task(
        process_and_archive_project,
        project_id=new_project.id,
        repo_archive=repo, 
        git_url=clean_git_url,
        pdf_path=temp_pdf_path
    )

    return {"status": "success", "project_id": new_project.id}

@router.get("/projects/search")
def search_projects(
    q: str = Query(..., min_length=2), 
    db: Session = Depends(get_db)
):
    # Recherche insensible à la casse dans le titre, la description et les technos
    results = db.query(Project).join(Project.technologies, isouter=True).filter(
        Project.status == "approved",
        or_(
            Project.title.ilike(f"%{q}%"),
            Project.description.ilike(f"%{q}%"),
            Technology.name.ilike(f"%{q}%")
        )
    ).distinct().all()

    return [{
        "id": p.id,
        "title": p.title,
        "program": p.program.name,
        "year": p.academic_year.label,
        "author": f"{p.owner.first_name} {p.owner.last_name}" if p.owner else "DIT",
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
def get_project_report(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()

    # --- 1. VALIDATION ---
    if not project or not project.report_pdf_url:
        raise HTTPException(
            status_code=404,
            detail="Aucun rapport archivé pour ce projet."
        )

    GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
    ORG = "DIT-Archives"
    REPO = "archive-projet"

    # --- 2. NETTOYAGE DU PATH ---
    path = project.report_pdf_url.strip()

    # Si jamais une URL complète traîne encore (ancienne donnée)
    if "github" in path:
        for separator in ["/main/", "/master/", "/blob/main/", "/blob/master/"]:
            if separator in path:
                path = path.split(separator)[-1]
                break

    # Suppression des paramètres et nettoyage
    path = path.split("?")[0].lstrip("/")
    clean_path = quote(unquote(path), safe="/")

    # --- 3. CONSTRUCTION URL FINALE ---
    target_url = f"https://raw.githubusercontent.com/{ORG}/{REPO}/main/{clean_path}"

    print(f"[DEBUG] URL finale --> {target_url}")

    headers = {
        "Authorization": f"token {GITHUB_TOKEN}",
        "Accept": "application/vnd.github.v3.raw"
    }

    try:
        # --- 4. REQUÊTE GITHUB ---
        response = requests.get(target_url, headers=headers, timeout=15)

        # fallback si branche master
        if response.status_code == 404:
            alt_url = target_url.replace("/main/", "/master/")
            print(f"[DEBUG] fallback master --> {alt_url}")
            response = requests.get(alt_url, headers=headers, timeout=15)

        # --- 5. GESTION ERREUR ---
        if response.status_code != 200:
            print(f"❌ GitHub {response.status_code} : {target_url}")
            raise HTTPException(
                status_code=404,
                detail="Le fichier PDF n'existe pas sur le dépôt GitHub."
            )

        # --- 6. RETOUR PDF ---
        return StreamingResponse(
            BytesIO(response.content),
            media_type="application/pdf",
            headers={
                "Content-Disposition": "inline; filename=rapport.pdf"
            }
        )

    # ⚠️ CRUCIAL : ne pas transformer les 404 en 500
    except HTTPException as http_exc:
        raise http_exc

    except Exception as e:
        print(f"💥 ERREUR SERVEUR : {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Erreur interne lors du chargement du PDF."
        )

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