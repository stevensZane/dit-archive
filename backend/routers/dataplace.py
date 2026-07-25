from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_

# Tes imports internes (à adapter selon la structure de ton projet)
from config.database import get_db
from models.sql_models import ExternalDataset, User
from models.pydantic_models import ExternalDatasetResponse, ExternalDatasetUpdate
from utils.auth_utils import get_current_user  # Ton dependency d'authentification JWT
from utils.cloudinary_utils import upload_to_cloudinary, delete_file_from_cloudinary

router = APIRouter(
    prefix="/api/dataplace",
    tags=["Dataplace / External Datasets"]
)


# ============================================================
#  1. LISTER & RECHERCHER DES DATASETS (GET)
# ============================================================
@router.get("/", response_model=List[ExternalDatasetResponse])
def get_datasets(
    search: Optional[str] = Query(None, description="Recherche par titre ou description"),
    category: Optional[str] = Query(None, description="Filtrer par catégorie (NLP, Vision, etc.)"),
    format: Optional[str] = Query(None, description="Filtrer par format (CSV, JSON, Parquet...)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Récupère la liste des datasets avec support de recherche, filtres et pagination.
    """
    query = db.query(ExternalDataset).options(joinedload(ExternalDataset.uploader))

    if search:
        query = query.filter(
            or_(
                ExternalDataset.title.ilike(f"%{search}%"),
                ExternalDataset.description.ilike(f"%{search}%")
            )
        )

    if category:
        query = query.filter(ExternalDataset.category == category)

    if format:
        query = query.filter(ExternalDataset.format == format)

    datasets = query.order_by(ExternalDataset.created_at.desc()).offset(skip).limit(limit).all()
    return datasets


# ============================================================
#  2. RÉCUPÉRER UN DATASET PAR ID (GET)
# ============================================================
@router.get("/{dataset_id}", response_model=ExternalDatasetResponse)
def get_dataset_by_id(dataset_id: int, db: Session = Depends(get_db)):
    """
    Obtenir les détails d'un dataset spécifique.
    """
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
#  3. UPLOADER & CRÉER UN DATASET (POST)
# ============================================================
@router.post("/", response_model=ExternalDatasetResponse, status_code=status.HTTP_201_CREATED)
async def create_dataset(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    format: Optional[str] = Form(None),
    size_label: Optional[str] = Form(None),
    rows_label: Optional[str] = Form(None),
    source_name: Optional[str] = Form("DIT Lab"),
    license: str = Form("Open Data"),
    file: UploadFile = File(...), # Fichier physique à uploader sur Cloudinary
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Téléverse un fichier sur Cloudinary et enregistre les métadonnées du Dataset en BDD.
    """
    # 1. Envoi du fichier sur Cloudinary via le helper
    # Le helper doit idéalement retourner un dict ex: {"url": "...", "public_id": "..."}
    try:
        cloudinary_res = await upload_to_cloudinary(file, folder="dataplace")
        
        # Support au cas où le helper renvoie un dict ou directement une URL
        if isinstance(cloudinary_res, dict):
            download_url = cloudinary_res.get("secure_url") or cloudinary_res.get("url")
            public_id = cloudinary_res.get("public_id")
        else:
            download_url = str(cloudinary_res)
            public_id = None

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Échec de l'upload du fichier sur Cloudinary : {str(e)}"
        )

    # 2. Création de l'entrée en base de données
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
    """
    Met à jour les métadonnées d'un dataset (accessible à l'uploader ou à un admin).
    """
    dataset = db.query(ExternalDataset).filter(ExternalDataset.id == dataset_id).first()

    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Dataset introuvable."
        )

    # Vérification des droits (Seul le propriétaire ou un admin/superadmin peut modifier)
    if dataset.uploaded_by_id != current_user.id and current_user.role not in ["admin", "superadmin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'avez pas la permission de modifier ce dataset."
        )

    # Application des modifications envoyées
    update_data = dataset_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(dataset, key, value)

    db.commit()
    db.refresh(dataset)
    return dataset


# ============================================================
#  5. SUPPRIMER UN DATASET (DELETE)
# ============================================================
@router.delete("/{dataset_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_dataset(
    dataset_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Supprime le dataset de la base de données ET son fichier hébergé sur Cloudinary.
    """
    dataset = db.query(ExternalDataset).filter(ExternalDataset.id == dataset_id).first()

    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Dataset introuvable."
        )

    # Vérification des droits
    if dataset.uploaded_by_id != current_user.id and current_user.role not in ["admin", "superadmin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'avez pas la permission de supprimer ce dataset."
        )

    # 1. Suppression du fichier sur Cloudinary (si un public_id est enregistré)
    if dataset.cloudinary_public_id:
        try:
            await delete_file_from_cloudinary(dataset.cloudinary_public_id)
        except Exception as e:
            # On log l'erreur sans bloquer la suppression BDD si nécessaire
            print(f"[Warning] Impossible de supprimer le fichier Cloudinary {dataset.cloudinary_public_id}: {str(e)}")

    # 2. Suppression dans la BDD
    db.delete(dataset)
    db.commit()

    return None