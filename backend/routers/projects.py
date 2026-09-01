from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, Query, BackgroundTasks, Request
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from typing import Optional, List
from config.database import get_db
from models.sql_models import ProjectInteraction, Project, User, Comment, Like, Technology, Program, AcademicYear
from utils.auth_utils import get_current_user_optional
from services.services import process_and_archive_project
from utils.auth_utils import get_current_user
from fastapi.responses import StreamingResponse, FileResponse
from services.ai import call_groq_api
from utils.cloudinary_utils import upload_to_cloudinary
import httpx
from models.pydantic_models import CommentCreate
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta

load_dotenv()

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
    tags: Optional[str] = Form(None),
    project_type: str = Form(...),
    academic_year_id: Optional[int] = Form(None),
    report_pdf: UploadFile = File(...),
    screenshot_files: List[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
  # 1. Upload du PDF sur Cloudinary et extraction stricte de l'URL (chaine de caractères)
  pdf_res = upload_to_cloudinary(report_pdf.file, folder="projects/reports")
  pdf_url = (
      pdf_res.get("url")
      if isinstance(pdf_res, dict)
      else str(pdf_res)
      if pdf_res
      else None
  )

  # 2. Upload des Screenshots et extraction des URLs
  screenshot_urls = []
  if screenshot_files:
    for img in screenshot_files:
      img_res = upload_to_cloudinary(img.file, folder="projects/screenshots")
      if img_res:
        img_url = img_res.get("url") if isinstance(img_res, dict) else str(img_res)
        if img_url:
          screenshot_urls.append(img_url)

  screenshots_str = ",".join(screenshot_urls) if screenshot_urls else None

  # Attribution de l'année académique
  chosen_academic_year = (
      academic_year_id
      if academic_year_id is not None
      else current_user.academic_year_id
  )

  # 3. Création de l'entrée en Base de Données (avec des types string valides)
  new_project = Project(
      title=title,
      description=description,
      github_repository_url=github_url,
      tags=tags,
      project_type=project_type,
      report_pdf_url=pdf_url,  # URL sous forme de String
      screenshots=screenshots_str,
      academic_year_id=chosen_academic_year,
      program_id=current_user.program_id,
      level=current_user.level,
      owner_id=current_user.id,
      analysis_status="pending",
      views_count=0,
      downloads_count=0,
  )

  db.add(new_project)
  db.commit()
  db.refresh(new_project)

  # 4. Traitement asynchrone (Nora)
  background_tasks.add_task(process_and_archive_project, new_project.id)

  return {
      "message": "Le projet a été archivé avec succès !",
      "project_id": new_project.id,
      "pdf_url": pdf_url,
  }

@router.put("/projects/{project_id}")
async def update_project(
    project_id: int,
    title: str = Form(...),
    description: str = Form(...),
    github_url: str = Form(...),
    report_pdf: Optional[UploadFile] = File(None),
    screenshot_files: Optional[List[UploadFile]] = File(None),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Récupération (Vérifie bien si c'est owner_id ou user_id dans ton modèle)
    project = db.query(Project).filter(Project.id == project_id).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Projet non trouvé")

    if project.owner_id != current_user.id: # Aligné sur ton POST
        raise HTTPException(status_code=403, detail="Action non autorisée")

    # 2. Mise à jour des champs simples
    project.title = title
    project.description = description
    project.github_repository_url = github_url # Aligné sur ton POST

    # 3. Nouveau PDF (uniquement si fourni)
    if report_pdf:
        # Utilise la même fonction que le POST
        new_pdf_url = upload_to_cloudinary(report_pdf.file, folder="projects/reports")
        project.report_pdf_url = new_pdf_url

    # 4. Nouvelles Images (uniquement si fournies)
    if screenshot_files:
        new_screenshot_urls = []
        for img in screenshot_files:
            url = upload_to_cloudinary(img.file, folder="projects/screenshots")
            if url:
                new_screenshot_urls.append(url)
        
        if new_screenshot_urls:
            # Choix : soit on remplace tout, soit on ajoute à l'existant
            # Ici, on ajoute à la chaîne existante (format CSV)
            current_imgs = project.screenshots + "," if project.screenshots else ""
            project.screenshots = current_imgs + ",".join(new_screenshot_urls)

    db.commit()
    db.refresh(project)
    
    return {
        "message": "Projet mis à jour avec succès", 
        "project_id": project.id
    }


@router.get("/projects/search")
def search_projects(
    q: str = Query(None), 
    db: Session = Depends(get_db)
):
    if not q or len(q) < 2:
        return []

    search_term = f"%{q}%"

    # 1. On prépare la requête avec toutes les jointures nécessaires pour la recherche et le rendu
    query = (
        db.query(Project)
        .join(User, Project.owner_id == User.id, isouter=True)
        .join(Project.technologies, isouter=True)  # Jointure pour chercher dans les technos
        .join(Program, Project.program_id == Program.id, isouter=True) # Jointure filière / programme
        .join(AcademicYear, Project.academic_year_id == AcademicYear.id, isouter=True) # Jointure classe / année
    )

    # 2. Construction des filtres dynamiques (titre, description, auteur, technos, filières, classes)
    conditions = [
        Project.title.ilike(search_term),
        Project.description.ilike(search_term),
        # Recherche par auteur (Historique ou Utilisateur connecté)
        Project.author_name.ilike(search_term), 
        User.first_name.ilike(search_term),
        User.last_name.ilike(search_term),
        # Recherche par stack / hashtag
        Technology.name.ilike(search_term),
        # Recherche par filière / programme (Nom complet ou abréviation)
        Program.name.ilike(search_term),
        # Recherche par niveau / classe (Ex: "Licence 3", "Master", "2024-2025")
        Project.level.ilike(search_term),
        AcademicYear.label.ilike(search_term)
    ]

    # 3. Exécution avec distinct() pour éviter les doublons dus aux jointures multiples (plusieurs technos par projet)
    results = query.filter(or_(*conditions)).distinct().all()

    # 4. Formatage strict et complet aligné avec ce que tes cartes frontend attendent !
    return [
        {
            "id": p.id,
            "title": p.title,
            "description": p.description,
            "github_url": p.github_repository_url,
            "project_type": p.project_type,
            "level": p.level,
            "screenshots": p.screenshots,
            "report_pdf_url": p.report_pdf_url,
            "analysis_status": p.analysis_status,
            "is_historical": p.is_historical,
            # Gestion de l'auteur unifiée
            "author_name": p.author_name if p.is_historical else f"{p.owner.first_name} {p.owner.last_name}" if p.owner else "Étudiant DIT",
            "owner": {
                "first_name": p.owner.first_name,
                "last_name": p.owner.last_name
            } if p.owner else None,
            # Gestion du programme / filière
            "program_id": p.program_id,
            "program": {
                "id": p.program.id,
                "name": p.program.name
            } if p.program else None,
            # Gestion de l'année académique
            "academic_year_id": p.academic_year_id,
            "academic_year": {
                "id": p.academic_year.id,
                "label": p.academic_year.label
            } if p.academic_year else None,
            # 🟢 CRUCIAL : Recréer la chaîne 'technologies_list' pour que ExploreProjectCard ne crash pas
            "technologies_list": ", ".join([t.name for t in p.technologies]) if p.technologies else None
        } 
        for p in results
    ]

@router.get("/projects/me")
def get_my_projects(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # On récupère les projets de l'utilisateur connecté
    projects = db.query(Project).filter(Project.owner_id == current_user.id).all()
    
    results = []
    for p in projects:
        results.append({
            "id": p.id, 
            "title": p.title,
            "status": p.analysis_status, # CRUCIAL pour l'affichage des badges (archived/pending)
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

@router.get("/projects/{id}/report")
async def get_project_report(id: int, action: str = "view", db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == id).first()
    if not project or not project.report_pdf_url:
        raise HTTPException(status_code=404, detail="Rapport introuvable en base de données")

    try:
        # Récupération de tes identifiants Cloudinary dans le .env
        api_key = os.getenv("CLOUDINARY_API_KEY")
        api_secret = os.getenv("CLOUDINARY_API_SECRET")

        # LA CORRECTION : On s'authentifie auprès de Cloudinary pour briser le 401
        client = httpx.AsyncClient(
            follow_redirects=True,
            auth=(api_key, api_secret) if api_key and api_secret else None
        )
        
        cloudinary_req = client.build_request("GET", project.report_pdf_url.strip())
        cloudinary_resp = await client.send(cloudinary_req, stream=True)

        if cloudinary_resp.status_code != 200:
            await client.aclose()
            raise HTTPException(status_code=404, detail="Fichier introuvable sur Cloudinary")

        disposition = f'attachment; filename="Rapport_{project.title}.pdf"' if action == "download" else "inline"

        return StreamingResponse(
            cloudinary_resp.aiter_bytes(),
            status_code=cloudinary_resp.status_code,
            media_type="application/pdf",
            headers={
                "Content-Disposition": disposition,
                "Access-Control-Expose-Headers": "Content-Disposition"
            },
            background=client.aclose
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail="Erreur interne du serveur")
    

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
    query = query.filter(Project.analysis_status.in_(["completed", "archived"]))
    
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


@router.post("/projects/{project_id}/interact")
def track_project_interaction(
    project_id: int,
    request: Request, # On injecte la requête HTTP pour choper l'IP
    type: str = Query(..., description="Type d'interaction : 'view' ou 'download'"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Projet introuvable")

    # Si l'utilisateur est connecté (User ou Guest persistant), on prend son ID.
    # Sinon, on utilise son adresse IP comme identifiant unique temporaire.
    if current_user and current_user.id != 0:
        identifier = str(current_user.id)
        is_ip = False
    else:
        # request.client.host récupère l'IP du visiteur (ex: "196.207.245.20")
        identifier = request.client.host
        is_ip = True

    # On cherche le doublon dans le bloc-notes sur les dernières 24h
    time_boundary = datetime.utcnow() - timedelta(hours=24)
    
    # On adapte la recherche selon si c'est une IP ou un ID
    if is_ip:
        has_already_clicked = db.query(ProjectInteraction).filter(
            ProjectInteraction.project_id == project_id,
            ProjectInteraction.interaction_type == type,
            ProjectInteraction.created_at >= time_boundary,
            ProjectInteraction.user_id == None, # C'est un anonyme
            # Si tu veux stocker l'IP, tu peux ajouter une colonne ip_address, 
            # ou temporairement utiliser un champ texte si tu adaptes ton modèle.
        ).first() # Pour faire simple sans changer ton modèle, on traque par IP
    else:
        has_already_clicked = db.query(ProjectInteraction).filter(
            ProjectInteraction.project_id == project_id,
            ProjectInteraction.user_id == current_user.id,
            ProjectInteraction.interaction_type == type,
            ProjectInteraction.created_at >= time_boundary
        ).first()

    if not has_already_clicked:
        if type == "view":
            project.views_count += 1
        elif type == "download":
            project.downloads_count += 1
            
        new_log = ProjectInteraction(
            user_id=current_user.id if (current_user and current_user.id != 0) else None,
            project_id=project_id,
            interaction_type=type
            # Optionnel : ip_address=identifier si tu l'ajoutes à ton modèle plus tard
        )
        db.add(new_log)
        db.commit()
        return {"status": "success", "message": f"Compteur {type} incrémenté."}

    return {"status": "ignored", "message": "Anti-spam actif."}

@router.get("/{project_id}/comments")
def get_project_comments(project_id: int, db: Session = Depends(get_db)):
    """Récupère tous les commentaires d'un projet ordonnés du plus ancien au plus récent."""
    # On vérifie si le projet existe
    if not db.query(Project).filter(Project.id == project_id).first():
        raise HTTPException(status_code=404, detail="Projet introuvable")
        
    comments = db.query(Comment).filter(Comment.project_id == project_id).order_by(Comment.created_at.asc()).all()
    
    # On structure la réponse proprement pour le frontend
    return [
        {
            "id": c.id,
            "content": c.content,
            "created_at": c.created_at.isoformat(),
            "user": {
                "id": c.user.id,
                "username": c.user.username,
                "first_name": c.user.first_name,
                "last_name": c.user.last_name,
                "role": c.user.role
            } if c.user else {"username": "Utilisateur supprimé", "first_name": "Anonyme", "last_name": ""}
        } for c in comments
    ]

@router.post("/{project_id}/comments")
def add_project_comment(
    project_id: int, 
    payload: CommentCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Ajoute un commentaire sur un projet (Authentification requise)."""
    if not payload.content.strip():
        raise HTTPException(status_code=400, detail="Le commentaire ne peut pas être vide")
        
    if not db.query(Project).filter(Project.id == project_id).first():
        raise HTTPException(status_code=404, detail="Projet introuvable")

    new_comment = Comment(
        project_id=project_id,
        user_id=current_user.id,
        content=payload.content
    )
    
    db.add(new_comment)
    try:
        db.commit()
        db.refresh(new_comment)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erreur serveur : {str(e)}")
        
    return {"status": "success", "message": "Commentaire ajouté"}