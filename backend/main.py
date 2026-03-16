import os
from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, Query, BackgroundTasks
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, func
from github import Github
from pydantic import BaseModel, EmailStr
from jose import jwt, JWTError
from fastapi.security import OAuth2PasswordRequestForm
import shutil
import uuid
import requests
from fastapi.responses import StreamingResponse
from io import BytesIO
from typing import Optional
from ai import generate_nora_summary
from database import *
from auth_utils import *
from services import *

Base.metadata.create_all(bind=engine)

app = FastAPI(title="DIT Archive API")

# # On crée le dossier s'il n'existe pas pour éviter les erreurs au démarrage
# os.makedirs("archives", exist_ok=True)

# # On "monte" le dossier archives sur l'URL /files
# app.mount("/files", StaticFiles(directory="archives"), name="static_archives")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Config GitHub
g = Github(os.getenv("GITHUB_TOKEN"))
repo = g.get_repo(os.getenv("REPO_NAME"))


# --- DEPENDENCIES ---

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(status_code=401, detail="Session expirée ou invalide")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None: raise credentials_exception
    except JWTError: raise credentials_exception
    
    user = db.query(User).filter(User.email == email).first()
    if user is None: raise HTTPException(status_code=404, detail="User non trouvé")
    return user

def require_role(required_role: str):
    def role_checker(current_user: User = Depends(get_current_user)):
        roles = {"student": 1, "admin": 2, "super_admin": 3}
        if roles.get(current_user.role, 0) < roles.get(required_role, 0):
            raise HTTPException(status_code=403, detail="Privilèges insuffisants")
        return current_user
    return role_checker

# --- SCHEMAS ---

class UserCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str
    academic_year_id: int
    program_id: int
    level: str

class UserCreateAdmin(UserCreate):
    role: str = "admin"

# --- ROUTES AUTH & USERS ---

@app.post("/users/signup")
def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email déjà utilisé")
    
    new_user = User(
        **user_data.dict(exclude={"password"}),
        password_hash=hash_password(user_data.password),
        role="student" # Forcé pour le signup public
    )
    db.add(new_user)
    db.commit()
    return {"message": "Compte créé"}

@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Identifiants incorrects")
    
    token = create_access_token(data={"sub": user.email, "role": user.role})
    return {"access_token": token, "token_type": "bearer", "user": {"role": user.role, "name": user.first_name}}

# --- ROUTES ADMIN ---

@app.post("/admin/users", status_code=201)
def admin_create_user(user_in: UserCreateAdmin, db: Session = Depends(get_db), admin: User = Depends(require_role("admin"))):
    new_user = User(
        **user_in.dict(exclude={"password"}),
        password_hash=hash_password(user_in.password)
    )
    db.add(new_user)
    db.commit()
    return {"message": "Utilisateur créé par l'admin"}

@app.get("/admin/users")
def list_users(db: Session = Depends(get_db), admin: User = Depends(require_role("admin"))):
    return db.query(User).all()

# --- ROUTES PROJETS ---
@app.post("/upload")
async def upload_project(
    background_tasks: BackgroundTasks,
    title: str = Form(...),
    description: str = Form(None),
    program_id: int = Form(...),
    year_id: int = Form(...),
    level: str = Form(...),
    primary_language: str = Form(None),
    code_file: UploadFile = File(...),
    report_file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Vérifications de base
    program = db.query(Program).filter(Program.id == program_id).first()
    year = db.query(AcademicYear).filter(AcademicYear.id == year_id).first()
    if not program or not year:
        raise HTTPException(status_code=404, detail="Filière ou Année invalide")

    # 2. Création de l'objet Project d'abord (pour avoir l'ID)
    new_project = Project(
        title=title,
        description=description,
        program_id=program_id,
        academic_year_id=year_id,
        level=level,
        primary_language=primary_language,
        owner_id=current_user.id,
        upload_method="zip",
        status="pending"
    )
    
    db.add(new_project)
    db.commit()
    db.refresh(new_project) # On récupère l'ID généré ici

    # 3. Création du dossier temporaire s'il n'existe pas
    os.makedirs("temp_uploads", exist_ok=True)

    # 4. Sauvegarde temporaire du PDF
    # On utilise l'ID du projet pour que ce soit unique
    temp_pdf_path = f"temp_uploads/pdf_{new_project.id}_{uuid.uuid4().hex}.pdf"
    with open(temp_pdf_path, "wb") as f:
        shutil.copyfileobj(report_file.file, f)

    # 5. Sauvegarde temporaire du ZIP (Code Source)
    temp_zip_filename = f"code_{new_project.id}_{uuid.uuid4().hex}.zip"
    temp_zip_path = os.path.join("temp_uploads", temp_zip_filename)
    with open(temp_zip_path, "wb") as buffer:
        shutil.copyfileobj(code_file.file, buffer)

    # 6. Lancement du worker en arrière-plan
    # Le worker va : nettoyer le zip, extraire le README, 
    # envoyer le ZIP et le PDF sur GitHub, puis mettre à jour la BD.
    background_tasks.add_task(
        process_and_archive_project,
        project_id=new_project.id,
        db=db,
        repo=repo, # Ton instance PyGithub
        zip_path=temp_zip_path,
        pdf_path=temp_pdf_path
    )

    return {
        "status": "success", 
        "message": f"Dépôt de '{title}' reçu ! Nora s'occupe de l'analyse...",
        "project_id": new_project.id
    }

@app.post("/projects/auto-archive")
async def auto_archive(
    background_tasks: BackgroundTasks,
    title: str = Form(...),
    description: str = Form(None),
    github_url: str = Form(...),
    program_id: int = Form(...),
    year_id: int = Form(...),
    level: str = Form(...),
    report_file: UploadFile = File(...), # Requis selon ton code
    primary_language: str = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Validation & Nettoyage de l'URL
    if "github.com" not in github_url:
        raise HTTPException(status_code=400, detail="Lien GitHub invalide")
    
    # Nettoyage auto : on garde que la racine du repo (évite les erreurs 128)
    clean_git_url = github_url.split("/tree/")[0].strip()

    # 2. Création du projet en statut "pending"
    new_project = Project(
        title=title,
        description=description,
        github_repository_url=clean_git_url,
        program_id=program_id,
        academic_year_id=year_id,
        level=level,
        primary_language=primary_language,
        owner_id=current_user.id,
        upload_method="github",
        status="pending"
    )

    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    
    # 3. Gestion du PDF (On prépare le terrain pour le worker)
    pdf_temp_path = None
    if report_file:
        # S'assurer que le dossier temporaire existe
        os.makedirs("temp_uploads", exist_ok=True)
        
        pdf_temp_path = f"temp_uploads/report_{new_project.id}_{uuid.uuid4().hex[:4]}.pdf"
        try:
            with open(pdf_temp_path, "wb") as buffer:
                shutil.copyfileobj(report_file.file, buffer)
        except Exception as e:
            print(f"Erreur sauvegarde temporaire PDF: {e}")
            # On continue quand même ou on raise ? Ici on continue pour le code.

    # 4. LE PASSAGE DE TÉMOIN (Version Complète)
    background_tasks.add_task(
        process_and_archive_project,
        project_id=new_project.id,
        db=db, # Attention: En background, il est parfois préférable de passer une nouvelle session
        repo=repo,
        git_url=clean_git_url,
        pdf_path=pdf_temp_path, # <--- ESSENTIEL : On passe le PDF ici !
        zip_path=None
    )

    return {
        "status": "success",
        "message": f"Nora a commencé le clonage de {title}. Le rapport et le code sont en cours de traitement.",
        "project_id": new_project.id
    }

@app.post("/admin/historical-upload")
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

# Stats pour le Dashboard Admin
@app.get("/admin/stats")
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

# --- ENDPOINTS UTILITAIRES (Pour le Front-end) ---

@app.get("/programs")
def get_programs(db: Session = Depends(get_db)):
    return db.query(Program).all()

@app.get("/academic-years")
def get_years(db: Session = Depends(get_db)):
    return db.query(AcademicYear).all()

@app.get("/technologies")
def get_technologies(db: Session = Depends(get_db)):
    return db.query(Technology).all()

@app.get("/projects/search")
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

@app.get("/projects/me")
def get_my_projects(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # On filtre par owner_id (ton modèle Project utilise owner_id)
    projects = db.query(Project).filter(Project.owner_id == current_user.id).all()
    
    # Retourne une liste simple que ton composant peut mapper
    return [{
        "id": p.id, 
        "title": p.title, 
        "program": p.program.name if p.program else "N/A", 
        "year": p.academic_year.label if p.academic_year else "N/A",
        "github_url": p.github_url if hasattr(p, 'github_url') else "#" 
    } for p in projects]

from urllib.parse import quote

@app.get("/projects/{project_id}/report")
def get_project_report(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    
    if not project or not project.report_pdf_url:
        raise HTTPException(status_code=404, detail="Rapport non trouvé")

    # CONFIGURATION
    GITHUB_ORG = "DIT-Archives"
    GITHUB_REPO = "archive-projet"
    GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")

    # --- NETTOYAGE DU CHEMIN ---
    raw_path = project.report_pdf_url

    # Si le worker a stocké une URL complète au lieu d'un chemin, on extrait juste la partie après "/main/"
    if "raw.githubusercontent.com" in raw_path:
        # On coupe après "/main/" pour ne garder que "archives/2020.../rapport.pdf"
        path_parts = raw_path.split("/main/")
        if len(path_parts) > 1:
            path = path_parts[1].split("?")[0] # On enlève aussi le "?token=..."
        else:
            path = raw_path
    else:
        path = raw_path

    # On encode correctement (une seule fois !)
    from urllib.parse import unquote, quote
    # On décode d'abord au cas où c'est déjà encodé, puis on ré-encode proprement
    clean_path = quote(unquote(path), safe="/")

    # CONSTRUCTION DE L'URL PROPRE
    target_url = f"https://raw.githubusercontent.com/{GITHUB_ORG}/{GITHUB_REPO}/main/{clean_path}"

    try:
        headers = {
            "Authorization": f"token {GITHUB_TOKEN}",
            "Accept": "application/vnd.github.v3.raw"
        }
        
        print(f"🚀 Tentative Proxy vers : {target_url}") # Pour vérifier dans ton terminal
        
        response = requests.get(target_url, headers=headers)

        if response.status_code != 200:
            raise HTTPException(status_code=404, detail="Fichier introuvable sur GitHub")

        return StreamingResponse(
            BytesIO(response.content), 
            media_type="application/pdf",
            headers={"Content-Disposition": "inline; filename=rapport.pdf"}
        )

    except Exception as e:
        print(f"❌ Erreur : {str(e)}")
        raise HTTPException(status_code=500, detail="Erreur interne")


@app.get("/projects/{project_id}")
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

@app.get("/projects")
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

@app.post("/projects/{project_id}/like")
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
    
# 1. Récupérer tous les projets (Admin)
@app.get("/admin/projects")
async def get_all_projects_admin(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Project).all()

# 2. Changer le statut d'un projet
@app.patch("/admin/projects/{project_id}/status")
async def update_project_status(project_id: int, status_update: dict, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Projet non trouvé")
    
    project.status = status_update.get("status")
    db.commit()
    return {"message": "Statut mis à jour"}

@app.patch("/admin/projects/{project_id}/status")
async def update_project_status(project_id: int, data: dict, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    project.status = data.get("status")
    if data.get("reason"):
        project.rejection_reason = data.get("reason") # Nora pourra s'en servir pour expliquer à l'élève !
    db.commit()
    return {"status": "updated"}

@app.get("/projects/{project_id}/ai-summary")
async def get_ai_summary(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Projet non trouvé")

    # Si le résumé existe déjà en DB, on le renvoie direct (gain de temps + $$$)
    if project.ai_summary:
        return {"summary": project.ai_summary}

    # Sinon, on le génère à la volée avec Groq
    try:
        # On prépare les infos pour le prompt
        project_data = {
            "title": project.title,
            "techs": [t.name for t in project.technologies],
            "desc": project.description
        }
        
        summary = generate_nora_summary(project_data)
        
        # On sauvegarde en DB pour la prochaine fois
        project.ai_summary = summary
        db.commit()
        
        return {"summary": summary}
    except Exception as e:
        print(f"❌ Erreur Groq : {e}")
        return {"summary": "Nora est un peu fatiguée, repassez plus tard !"}

from langchain_chroma import Chroma
from langchain_groq import ChatGroq
from langchain_nomic import NomicEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyMuPDFLoader


embeddings = NomicEmbeddings(
    model="nomic-embed-text-v1.5", 
    nomic_api_key=os.getenv("NOMIC_API_KEY")
)

# Pour le cerveau (LLM), on passe sur Groq avec Llama 3.3 (le plus costaud)
llm = ChatGroq(
    temperature=0.1, # On reste précis pour une archive
    model_name="llama-3.3-70b-versatile", 
    groq_api_key=os.getenv("GROQ_API_KEY")
)

text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
CHROMA_PATH = "./nora_vectors"
# Dossier où ChromaDB va stocker ses données (persistance)


# --- MODELS ---
class ChatRequest(BaseModel):
    query: str

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    query: str
    history: list[Message] = [] # On reçoit l'historique ici

# --- ENDPOINTS ---

@app.post("/chatbot/ask")
async def ask_nora(request: ChatRequest):
    try:
        # 1. Recherche dans ChromaDB
        vector_db = Chroma(persist_directory=CHROMA_PATH, embedding_function=embeddings)
        docs = vector_db.similarity_search(request.query, k=5)
        
        #1. On récupère les sources uniques avec leurs liens
        sources = []
        seen_titles = set()
        for doc in docs:
            title = doc.metadata.get('title', 'Archive')
            url = doc.metadata.get('pdf_url') # Assure-toi de l'avoir mis à l'ingestion !
            if title not in seen_titles:
                sources.append({"title": title, "url": url})
                seen_titles.add(title)
        
        # 2. Préparation du contexte avec les sources
        context_parts = []
        for doc in docs:
            source = doc.metadata.get('title', 'Archive inconnue')
            context_parts.append(f"[Source: {source}]\n{doc.page_content}")
        
        context = "\n\n---\n\n".join(context_parts)

        # 3. LE SYSTEM PROMPT (Tes règles d'or)
        system_instructions = f"""
        Tu es Nora, l'IA experte du DIT. Ton but est de synthétiser les archives du Dakar Institute of Technology.

        RÈGLES DE RÉPONSE ET CITATION :
        1. Analyse le contexte fourni pour répondre. Si l'info n'y est pas, dis-le poliment.
        2. SYNTHÈSE : Ne liste pas les sources une par une si elles disent la même chose. Regroupe tes idées.
        3. CITATION DISCRÈTE : Cite les sources entre parenthèses ou en fin de phrase, par exemple : (Source: Projet Riz, 2023). 
        4. PERTINENCE : Ne cite un projet que si l'information que tu donnes provient directement de lui. Si tu fais une réponse générale basée sur 3 projets, écris "Selon les archives des projets X, Y et Z..." au début.
        5. STYLE : Reste concise. L'utilisateur veut une réponse, pas une bibliographie.
        6. STRUCTURE : Utilise des listes à puces (-) pour les énumérations.
        7. EMPHASE : Mets en **gras** les dates, les chiffres clés, les noms de technologies et les noms propres.
        CONTEXTE DES ARCHIVES :
        {context}
        """

        # 4. RECONSTRUCTION DE LA CONVERSATION (Historique + Question actuelle)
        messages_for_ai = [
            ("system", system_instructions)
        ]
        
        # On ajoute les messages précédents (l'historique)
        for msg in request.history:
            role = "human" if msg.role == "user" else "assistant"
            messages_for_ai.append((role, msg.content))
            
        # On ajoute la question actuelle si elle n'est pas déjà dans l'historique envoyé
        # Si ton front envoie l'historique SANS la dernière question :
        messages_for_ai.append(("human", request.query))

        # 5. Appel à Groq
        response = llm.invoke(messages_for_ai)
        
        return {"answer": response.content}
        
    except Exception as e:
        print(f"❌ Erreur Nora: {e}")
        return {"answer": "Je n'arrive pas à fouiller dans mes dossiers pour le moment.",
                "answer": response.content,
                "sources": sources
                
                }

@app.post("/chatbot/upload-doc")
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

@app.post("/chatbot/ingest/{project_id}")
async def auto_ingest_project(project_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Récupère le mémoire du projet et l'envoie à Nora."""
    
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project or not project.pdf_url:
        raise HTTPException(status_code=404, detail="Projet ou PDF introuvable")

    # Chemin local temporaire
    os.makedirs("temp_storage", exist_ok=True)
    local_pdf = f"temp_storage/project_{project_id}.pdf"

    # On définit la logique de téléchargement + traitement
    def full_ingestion_flow():
        if download_pdf(project.pdf_url, local_pdf):
            process_pdf_logic(local_pdf, metadata={
                "project_id": project_id,
                "title": project.title,
                "author": project.author
            })
            # Nettoyage après ingestion
            if os.path.exists(local_pdf):
                os.remove(local_pdf)

    background_tasks.add_task(full_ingestion_flow)
    return {"message": "Nora commence l'apprentissage du projet."}


def process_pdf_logic(file_path: str, metadata: dict):
    """La cuisine interne : PDF -> Texte -> Chunks -> Vecteurs -> ChromaDB."""
    try:
        # 1. Charger
        loader = PyMuPDFLoader(file_path)
        documents = loader.load()
        
        # 2. Découper
        chunks = text_splitter.split_documents(documents)
        
        # 3. Ajouter les métadonnées
        for chunk in chunks:
            chunk.metadata.update(metadata)
            
        # 4. Initialiser la DB et ajouter les documents
        # Utiliser .from_documents sur le même persist_directory va APPEND (ajouter) 
        # les nouveaux vecteurs à l'existant.
        vector_db = Chroma.from_documents(
            documents=chunks, 
            embedding=embeddings, 
            persist_directory=CHROMA_PATH
        )
        print(f"✅ Nora a appris : {metadata.get('title', 'Document manuel')}")
        
    except Exception as e:
        print(f"❌ Erreur lors du process_pdf: {e}")
    finally:
        # Nettoyage systématique du fichier temporaire pour ne pas saturer le serveur
        if os.path.exists(file_path):
            os.remove(file_path)
            print(f"🗑️ Nettoyage : {file_path} supprimé.")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)