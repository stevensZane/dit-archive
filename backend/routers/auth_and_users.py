from pydantic_models import *
from auth_utils import *
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from database import *
from auth_utils import *
from services import *

router = APIRouter(
    prefix="",
    tags=["auth and users"]
)


@router.post("/users/signup")
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

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Identifiants incorrects")
    
    token = create_access_token(data={"sub": user.email, "role": user.role})
    return {"access_token": token, "token_type": "bearer", "user": {"role": user.role, "name": user.first_name}}

@router.post("/admin/users", status_code=201)
def admin_create_user(user_in: UserCreateAdmin, db: Session = Depends(get_db), admin: User = Depends(require_role("admin"))):
    new_user = User(
        **user_in.dict(exclude={"password"}),
        password_hash=hash_password(user_in.password)
    )
    db.add(new_user)
    db.commit()
    return {"message": "Utilisateur créé par l'admin"}






