from models.sql_models import Program, AcademicYear, Technology, Feedback
from config.database import get_db
from fastapi import Depends, APIRouter
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from utils.auth_utils import get_current_user
from models.pydantic_models import FeedbackCreate


router = APIRouter(
    prefix="",
    tags=["useful endpoints"]
)

@router.get("/programs")
def get_programs(db: Session = Depends(get_db)):
    return db.query(Program).all()

@router.get("/academic-years")
def get_years(db: Session = Depends(get_db)):
    return db.query(AcademicYear).all()

@router.get("/technologies")
def get_technologies(db: Session = Depends(get_db)):
    return db.query(Technology).all()

@router.post("/feedbacks", status_code=status.HTTP_201_CREATED)
def create_feedback(
    payload: FeedbackCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)  # Récupère l'user connecté (Étudiant ou Guest)
):
    """
    Enregistre un feedback (bug, suggestion, autre) lié à l'utilisateur connecté.
    """
    # 1. Validation de sécurité sur le type envoyé par le Front
    if payload.type not in ["bug", "suggestion", "autre"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Type de feedback invalide. Choisissez parmi 'bug', 'suggestion' ou 'autre'."
        )
        
    if not payload.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le message ne peut pas être vide."
        )

    try:
        # 2. Création de l'enregistrement en utilisant ta table existante
        new_feedback = Feedback(
            type=payload.type,
            message=payload.message.strip(),
            user_id=current_user.id,  # Track l'id de l'étudiant (ou du guest)
            is_resolved=False,        # Par défaut non résolu (géré par ta structure)
            admin_notes=None
        )
        
        db.add(new_feedback)
        db.commit()
        db.refresh(new_feedback)
        
        return {
            "status": "success",
            "message": "Feedback enregistré avec succès.",
            "id": new_feedback.id
        }
        
    except Exception as e:
        db.rollback()
        print(f"❌ Erreur lors de la sauvegarde du feedback : {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur interne. Impossible de sauvegarder votre retour."
        )

