from pydantic import BaseModel, EmailStr
from typing import List, Optional

class UserBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr

class UserCreate(UserBase):
    password: str
    academic_year_id: int
    program_id: int
    level: str
    # Le rôle est forcé à "student" dans le code du backend, 
    # donc pas besoin de le mettre ici.

class AdminCreate(UserBase):
    password: str
    role: str = "admin" # guest, admin, ou superadmin
    # Optionnels car un admin/guest n'est pas forcément un étudiant
    academic_year_id: Optional[int] = None
    program_id: Optional[int] = None
    level: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    name: str

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    query: str
    history: List[Message] = []

class MetadataInit(BaseModel):
    technologies: List[str]
    programs: List[str]  # Filières
    academic_years: Optional[List[str]] = None