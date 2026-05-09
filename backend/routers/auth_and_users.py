from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from database import get_db, User
from pydantic_models import UserCreate, AdminCreate, Token # Utilise tes nouveaux noms
from auth_utils import hash_password, verify_password, create_access_token, require_role
from mailer import send_welcome_email

router = APIRouter(prefix="", tags=["auth and users"])

# --- 1. SIGNUP PUBLIC (Étudiants uniquement) ---
@router.post("/users/signup", status_code=status.HTTP_201_CREATED)
def signup(user_data: UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    email_clean = user_data.email.lower().strip()
    
    if db.query(User).filter(User.email == email_clean).first():
        raise HTTPException(status_code=400, detail="Email déjà utilisé")
    
    # Rôle forcé à 'student' pour la sécurité
    new_user = User(
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        email=email_clean,
        password_hash=hash_password(user_data.password),
        academic_year_id=user_data.academic_year_id,
        program_id=user_data.program_id,
        level=user_data.level,
        role="student" 
    )
    
    db.add(new_user)
    try:
        db.commit()
        db.refresh(new_user)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Erreur lors de la création")

    background_tasks.add_task(send_welcome_email, new_user.email, new_user.first_name)
    return {"message": "Compte étudiant créé"}

# --- 2. LOGIN ---
@router.post("/login", response_model=None) # Tu peux utiliser le schéma Token ici
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username.lower().strip()).first()
    
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Identifiants incorrects")
    
    # On injecte le rôle dans le token pour le RBAC
    token = create_access_token(data={"sub": user.email, "role": user.role})
    
    return {
        "access_token": token, 
        "token_type": "bearer", 
        "user": {
            "role": user.role, 
            "name": f"{user.first_name} {user.last_name}"
        }
    }




