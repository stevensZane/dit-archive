import os
from datetime import datetime, timedelta
from jose import jwt
from fastapi.security import OAuth2PasswordBearer, HTTPBearer, HTTPAuthorizationCredentials
from passlib.context import CryptContext
from dotenv import load_dotenv
from models.sql_models import User
from config.database import get_db
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 1440))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/users/login")

# --- UTILITAIRES DE MOT DE PASSE ---
def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    
    # Si une durée spécifique est passée (ex: pour le Guest), on l'utilise.
    # Sinon, on prend la configuration globale par défaut.
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# --- DÉPENDANCE : RÉCUPÉRER L'UTILISATEUR ACTUEL ---
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        # 🟢 CORRECTION 1 : Utilisation de jwt.decode avec la liste d'algorithmes
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except Exception:
        raise HTTPException(status_code=401, detail="Token invalide ou expiré")

    role = payload.get("role")
    username_or_email = payload.get("sub")
    
    if role == "guest":
        # 🟢 CORRECTION 2 : Plus besoin de ré-importer User ici, il est déjà importé au niveau global !
        return User(
            id=0,
            first_name="Invité",
            last_name="Explorateur",
            username=username_or_email,
            email=f"{username_or_email}@temporary.dit",
            role="guest",
            program_id=None,
            academic_year_id=None,
            level=None
        )
        
    user = db.query(User).filter(User.email == username_or_email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Utilisateur introuvable")
    return user

security_optional = HTTPBearer(auto_error=False)

def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_optional), 
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Identifie l'utilisateur si un token valide est fourni.
    Si aucun token n'est présent (Guest pur), retourne None sans bloquer la requête.
    """
    if not credentials:
        return None

    token = credentials.credentials

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        role = payload.get("role")
        username_or_email = payload.get("sub")
        
        if not username_or_email:
            return None 

        if role == "guest":
            return User(
                id=0,
                first_name="Invité",
                last_name="Explorateur",
                username=username_or_email,
                email=f"{username_or_email}@temporary.dit",
                role="guest",
                program_id=None,
                academic_year_id=None,
                level=None
            )
            
        user = db.query(User).filter(User.email == username_or_email).first()
        return user 

    except Exception:
        return None

def require_role(required_role):
    # On enleve le type strict 'str' pour accepter une liste ou une string
    def role_checker(current_user: User = Depends(get_current_user)):
        role_hierarchy = {
            "guest": 0,
            "student": 1,
            "admin": 2,
            "superadmin": 3
        }
        
        user_role_level = role_hierarchy.get(current_user.role, 0)

        # Si required_role est une liste (ex: ["admin", "superadmin"])
        if isinstance(required_role, list):
            # On recupere les niveaux de chaque role de la liste
            required_levels = [role_hierarchy.get(r, 0) for r in required_role]
            # Le niveau minimum requis pour entrer est le plus bas de la liste fournie
            required_role_level = min(required_levels) if required_levels else 0
            role_label = ", ".join(required_role)
        else:
            # Si c'est une simple string (ex: "admin")
            required_role_level = role_hierarchy.get(required_role, 0)
            role_label = required_role

        if user_role_level < required_role_level:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail=f"Acces refuse : Privileges [{role_label}] requis"
            )
        return current_user
    return role_checker