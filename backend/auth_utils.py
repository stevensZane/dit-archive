# import os
# from datetime import datetime, timedelta
# from jose import JWTError, jwt
# from fastapi.security import OAuth2PasswordBearer
# from passlib.context import CryptContext
# from dotenv import load_dotenv
# from database import *
# from fastapi import Depends, HTTPException
# from sqlalchemy.orm import Session


# load_dotenv()

# SECRET_KEY = os.getenv("SECRET_KEY")
# ALGORITHM = os.getenv("ALGORITHM")
# ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 1440))

# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
# oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# def hash_password(password: str):
#     return pwd_context.hash(password)

# def verify_password(plain_password, hashed_password):
#     return pwd_context.verify(plain_password, hashed_password)

# def create_access_token(data: dict):
#     to_encode = data.copy()
#     expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
#     to_encode.update({"exp": expire})
#     return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
#     credentials_exception = HTTPException(status_code=401, detail="Session expirée ou invalide")
#     try:
#         payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
#         email: str = payload.get("sub")
#         if email is None: raise credentials_exception
#     except JWTError: raise credentials_exception
    
#     user = db.query(User).filter(User.email == email).first()
#     if user is None: raise HTTPException(status_code=404, detail="User non trouvé")
#     return user

# def require_role(required_role: str):
#     def role_checker(current_user: User = Depends(get_current_user)):
#         roles = {"student": 1, "admin": 2, "super_admin": 3}
#         if roles.get(current_user.role, 0) < roles.get(required_role, 0):
#             raise HTTPException(status_code=403, detail="Privilèges insuffisants")
#         return current_user
#     return role_checker

import os
from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from dotenv import load_dotenv
from database import get_db
from database import User
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 1440))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# --- UTILITAIRES DE MOT DE PASSE ---
def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

# --- GESTION DES TOKENS ---
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    # On s'assure que le rôle est bien dans le payload pour lecture rapide côté Front
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# --- DÉPENDANCE : RÉCUPÉRER L'UTILISATEUR ACTUEL ---
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Session expirée ou invalide",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    return user

# --- DÉPENDANCE : VÉRIFICATION DES RÔLES (RBAC) ---
def require_role(required_role: str):
    def role_checker(current_user: User = Depends(get_current_user)):
        # Hiérarchie des rôles : plus le chiffre est haut, plus on a de pouvoir
        role_hierarchy = {
            "guest": 0,
            "student": 1,
            "admin": 2,
            "superadmin": 3
        }
        
        user_role_level = role_hierarchy.get(current_user.role, 0)
        required_role_level = role_hierarchy.get(required_role, 0)

        if user_role_level < required_role_level:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail=f"Accès refusé : Privilèges {required_role} requis"
            )
        return current_user
    return role_checker