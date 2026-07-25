from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from datetime import datetime

class UserBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr

class UserCreate(BaseModel):
    username: str
    first_name: str
    last_name: str
    email: EmailStr
    password: str
    academic_year_id: int
    program_id: int
    level: str
    has_accepted_terms: bool
    
class UserLogin(BaseModel):
    username_or_email: str
    password: str

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


class MessageHistoryItem(BaseModel):
    """
    Structure d'un message individuel dans l'historique de discussion.
    Fait le pont avec le format de ton frontend.
    """
    role: str = Field(..., description="Le rôle de l'émetteur : 'user' ou 'nora'")
    content: str = Field(..., description="Le texte du message")

class ChatPayload(BaseModel):
    """
    Le schéma global reçu par l'endpoint /chatbot/ask.
    Valide toutes les données nécessaires au traitement et à l'anonymisation.
    """
    chat_id: str = Field(..., description="L'identifiant de la session de chat (ex: timestamp)")
    query: str = Field(..., description="La nouvelle question posée par l'utilisateur")
    history: List[MessageHistoryItem] = Field(
        default=[], 
        description="La liste des anciens messages pour donner du contexte à Nora"
    )

    class Config:
        # Permet à Pydantic de lire les données même si ce sont des objets ORM
        from_attributes = True

# Schéma Pydantic pour valider l'entrée du formulaire React
class FeedbackCreate(BaseModel):
    type: str
    message: str

class FeedbackPayload(BaseModel):
    chat_id: str
    has_negative_feedback: bool


class CommentCreate(BaseModel):
    content: str


class UserMinimalResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    avatar_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

# Schema de réponse principal
class ExternalDatasetResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    format: Optional[str] = None
    size_label: Optional[str] = None
    rows_label: Optional[str] = None
    source_name: Optional[str] = None
    download_url: str
    cloudinary_public_id: Optional[str] = None
    license: str
    is_verified: bool
    created_at: datetime
    uploaded_by_id: Optional[int] = None
    uploader: Optional[UserMinimalResponse] = None

    model_config = ConfigDict(from_attributes=True)

# Schema pour la mise à jour partielle des infos
class ExternalDatasetUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    format: Optional[str] = None
    size_label: Optional[str] = None
    rows_label: Optional[str] = None
    source_name: Optional[str] = None
    license: Optional[str] = None
    is_verified: Optional[bool] = None