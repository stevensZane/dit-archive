from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from config.database import get_db
from models.sql_models import User
from models.pydantic_models import UserCreate
from utils.auth_utils import hash_password, verify_password, create_access_token
from services.mailer import send_welcome_email
import uuid
from datetime import datetime, timedelta
import os

from dotenv import load_dotenv

load_dotenv()


router = APIRouter(prefix="", tags=["auth and users"])

# --- 1. SIGNUP PUBLIC (Étudiants uniquement) ---
@router.post("/users/signup", status_code=status.HTTP_201_CREATED)
def signup(user_data: UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    email_clean = user_data.email.lower().strip()
    username_clean = user_data.username.lower().strip()
    
    # 1. Vérifications de sécurité uniques
    if db.query(User).filter(User.email == email_clean).first():
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé")
        
    if db.query(User).filter(User.username == username_clean).first():
        raise HTTPException(status_code=400, detail="Ce nom d'utilisateur est déjà pris")
    
    # 2. Génération automatique d'un avatar par défaut super propre avec ses initiales
    # Exemple: https://ui-avatars.com/api/?name=John+Doe&background=004751&color=fff
    avatar_default_url = f"https://ui-avatars.com/api/?name={user_data.first_name}+{user_data.last_name}&background=004751&color=fff&bold=true"

    # 3. Création du nouvel utilisateur Student avec tous ses attributs
    new_user = User(
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        username=username_clean,
        email=email_clean,
        password_hash=hash_password(user_data.password),
        academic_year_id=user_data.academic_year_id,
        program_id=user_data.program_id,
        level=user_data.level,
        avatar_url=avatar_default_url, # Ajouté de façon transparente !
        role="student",
        has_accepted_terms=user_data.has_accepted_terms,
        terms_accepted_at=datetime.utcnow() if user_data.has_accepted_terms else None
    )
    
    db.add(new_user)
    try:
        db.commit()
        db.refresh(new_user)
    except Exception as e:
        db.rollback()
        print(f"Erreur d'inscription : {e}")
        raise HTTPException(status_code=500, detail="Erreur technique lors de la création du compte")

    # Tâche de fond pour l'email de bienvenue
    background_tasks.add_task(send_welcome_email, new_user.email, new_user.first_name)
    
    return {"message": "Compte étudiant DIT créé avec succès !"}

# --- 2. LOGIN ---
@router.post("/users/login", response_model=None)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    login_input = form_data.username.lower().strip()
    
    # Recherche flexible : on vérifie si l'input matche l'email OU le username
    user = db.query(User).filter(
        (User.email == login_input) | (User.username == login_input)
    ).first()
    
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Identifiants incorrects")
    
    # Mise à jour de la dernière activité
    user.last_seen = datetime.utcnow().isoformat()
    try:
        db.commit()
    except Exception:
        db.rollback()

    # On injecte le rôle dans le token pour le RBAC
    token = create_access_token(data={"sub": user.email, "role": user.role})
    
    return {
        "access_token": token, 
        "token_type": "bearer", 
        "user": {
            "role": user.role, 
            "name": f"{user.first_name} {user.last_name}",
            "username": user.username,
            "avatar_url": user.avatar_url, # Transmis au chat pour les bulles de messages
            "level": user.level
        }
    }


GUEST_DURATION_MINUTES = int(os.getenv("GUEST_DURATION_MINUTES"))

@router.post("/users/guest-login")
def guest_login(db: Session = Depends(get_db)):
    """
    Crée un profil Guest persistant en base de données pour assurer la traçabilité Data,
    puis génère un token JWT à durée limitée.
    """
    # 1. Génération d'identifiants uniques et éphémères
    unique_suffix = uuid.uuid4().hex[:6]
    guest_username = f"guest_{unique_suffix}"
    guest_email = f"{guest_username}@guest.dit.sn"
    
    # 2. Création et insertion du Guest en Base de Données
    new_guest = User(
        first_name="Invité",
        last_name=f"Explorateur #{unique_suffix.upper()}",
        username=guest_username,
        email=guest_email,
        password_hash=hash_password(uuid.uuid4().hex),  # Mot de passe aléatoire inutilisable
        role="guest",
        avatar_url=f"https://ui-avatars.com/api/?name=Guest+{unique_suffix}&background=64748B&color=fff",
        level=None,
        program_id=None,
        academic_year_id=None,
        has_accepted_terms=True,  # Validé implicitement par le clic d'exploration
        terms_accepted_at=datetime.utcnow(),
        last_seen=datetime.utcnow().isoformat()
    )
    
    db.add(new_guest)
    try:
        db.commit()
        db.refresh(new_guest)
    except Exception as e:
        db.rollback()
        print(f"Erreur lors du commit du Guest: {e}")
        raise HTTPException(status_code=500, detail="Impossible d'initialiser la session invité")

    # 3. Génération du JWT avec la durée d'expiration restreinte (Maintenant supportée !)
    expiration_delta = timedelta(minutes=GUEST_DURATION_MINUTES)
    token_data = {
        "sub": new_guest.email,
        "role": "guest"
    }
    
    # 🟢 L'appel passe désormais 'expires_delta' de manière sécurisée
    token = create_access_token(data=token_data, expires_delta=expiration_delta)
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "role": new_guest.role,
            "name": f"{new_guest.first_name} {new_guest.last_name}",
            "username": new_guest.username,
            "avatar_url": new_guest.avatar_url,
            "level": None
        }}


