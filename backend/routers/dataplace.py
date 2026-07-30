from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_

from config.database import get_db
from models.sql_models import ExternalDataset, User
from models.pydantic_models import ExternalDatasetResponse, ExternalDatasetUpdate
from utils.auth_utils import get_current_user
from utils.cloudinary_utils import upload_to_cloudinary, delete_from_cloudinary

router = APIRouter(
    prefix="/api/dataplace",
    tags=["Dataplace / External Datasets"]
)

MAX_FILE_SIZE_BYTES = 200 * 1024 * 1024  # 200 Mo


# ============================================================
#  1. LISTER & RECHERCHER DES DATASETS (GET)
# ============================================================
@router.get("/", response_model=List[ExternalDatasetResponse])
def get_datasets(
    search: Optional[str] = Query(None, description="Recherche par titre ou description"),
    category: Optional[str] = Query(None, description="Filtrer par catégorie"),
    format: Optional[str] = Query(None, description="Filtrer par format"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Récupère la liste des datasets avec support de recherche, filtres et pagination.
    """
    query = db.query(ExternalDataset).options(joinedload(ExternalDataset.uploader))

    if search and search.strip():
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                ExternalDataset.title.ilike(search_term),
                ExternalDataset.description.ilike(search_term)
            )
        )

    if category and category not in ["Tous", ""]:
        query = query.filter(ExternalDataset.category == category)

    if format and format not in ["Tous", ""]:
        query = query.filter(ExternalDataset.format.ilike(f"%{format}%"))

    datasets = query.order_by(ExternalDataset.created_at.desc()).offset(skip).limit(limit).all()
    return datasets


# ============================================================
#  2. RÉCUPÉRER UN DATASET PAR ID (GET)
# ============================================================
@router.get("/{dataset_id}", response_model=ExternalDatasetResponse)
def get_dataset_by_id(dataset_id: int, db: Session = Depends(get_db)):
    dataset = db.query(ExternalDataset).options(
        joinedload(ExternalDataset.uploader)
    ).filter(ExternalDataset.id == dataset_id).first()

    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Dataset introuvable."
        )

    return dataset


# ============================================================
#  3. CRÉER & UPLOADER UN DATASET (POST)
# ============================================================
@router.post("/", response_model=ExternalDatasetResponse, status_code=status.HTTP_201_CREATED)
async def create_dataset(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    category: Optional[str] = Form("NLP & IA Vocale"),
    format: Optional[str] = Form("CSV"),
    size_label: Optional[str] = Form("Inconnu"),
    rows_label: Optional[str] = Form(None),
    source_name: Optional[str] = Form("DIT Community"),
    license: str = Form("Open Data"),
    external_url: Optional[str] = Form(None, description="Lien externe si > 200Mo (Drive, HuggingFace, etc.)"),
    file: Optional[UploadFile] = File(None, description="Fichier physique (max 200 Mo)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Permet à tout utilisateur authentifié de soumettre un dataset.
    - Si un fichier est fourni (<= 200Mo) : upload sur Cloudinary.
    - Sinon : utilisation obligatoire de external_url.
    """
    download_url = external_url
    public_id = None

    if file and file.filename:
        # 1. Vérification de la taille du fichier
        file.file.seek(0, 2)
        file_size = file.file.tell()
        file.file.seek(0)

        if file_size > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="Le fichier dépasse la limite de 200 Mo. Veuillez utiliser un lien externe."
            )

        # 2. Upload Cloudinary (support des fichiers non-image et conservation du nom)
        try:
            cloudinary_res = upload_to_cloudinary(
                file.file,
                folder="dit_datasets",
                resource_type="auto",
                use_filename=True,
                unique_filename=True
            )
            
            if isinstance(cloudinary_res, dict):
                download_url = cloudinary_res.get("secure_url") or cloudinary_res.get("url")
                public_id = cloudinary_res.get("public_id")
            elif isinstance(cloudinary_res, str):
                download_url = cloudinary_res
            else:
                raise Exception("Réponse Cloudinary invalide.")
                
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Échec de l'upload sur Cloudinary : {str(e)}"
            )

    if not download_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Veuillez fournir un fichier (<= 200 Mo) ou un lien de téléchargement externe."
        )

    # 3. Enregistrement en base de données
    new_dataset = ExternalDataset(
        title=title,
        description=description,
        category=category,
        format=format,
        size_label=size_label,
        rows_label=rows_label,
        source_name=source_name,
        download_url=download_url,
        cloudinary_public_id=public_id,
        license=license,
        uploaded_by_id=current_user.id
    )

    db.add(new_dataset)
    db.commit()
    db.refresh(new_dataset)

    # Rattachement explicite de l'uploader pour la réponse Pydantic
    new_dataset.uploader = current_user

    return new_dataset


# ============================================================
#  4. METTRE À JOUR UN DATASET (PUT)
# ============================================================
@router.put("/{dataset_id}", response_model=ExternalDatasetResponse)
def update_dataset(
    dataset_id: int,
    dataset_update: ExternalDatasetUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    dataset = db.query(ExternalDataset).options(
        joinedload(ExternalDataset.uploader)
    ).filter(ExternalDataset.id == dataset_id).first()

    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Dataset introuvable."
        )

    # Seul le propriétaire ou un admin peut modifier
    if dataset.uploaded_by_id != current_user.id and current_user.role not in ["admin", "superadmin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'avez pas l'autorisation de modifier ce dataset."
        )

    update_data = dataset_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(dataset, key, value)

    db.commit()
    db.refresh(dataset)
    
    # Re-charger la relation uploader après le refresh
    db.query(ExternalDataset).options(
        joinedload(ExternalDataset.uploader)
    ).filter(ExternalDataset.id == dataset.id).first()

    return dataset


# ============================================================
#  5. SUPPRIMER UN DATASET (DELETE)
# ============================================================
@router.delete("/{dataset_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_dataset(
    dataset_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    dataset = db.query(ExternalDataset).filter(ExternalDataset.id == dataset_id).first()

    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Dataset introuvable."
        )

    # Seul le propriétaire ou un admin peut supprimer
    if dataset.uploaded_by_id != current_user.id and current_user.role not in ["admin", "superadmin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'avez pas l'autorisation de supprimer ce dataset."
        )

    # Suppression du fichier sur Cloudinary
    if dataset.cloudinary_public_id:
        try:
            # Essaie de supprimer en mode RAW (fichiers zip, csv, docs)
            delete_from_cloudinary(dataset.cloudinary_public_id, resource_type="raw")
        except Exception as e:
            try:
                # Fallback sur le mode par défaut si ce n'était pas un fichier RAW
                delete_from_cloudinary(dataset.cloudinary_public_id)
            except Exception as err:
                print(f"[Warning Cloudinary Delete] {str(err)}")

    db.delete(dataset)
    db.commit()
    return None

