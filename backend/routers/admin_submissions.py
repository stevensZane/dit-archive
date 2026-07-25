import re
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session, joinedload
from config.database import get_db
from models.sql_models import StudentRoster, User, Project

router = APIRouter(prefix="/admin", tags=["Admin Submissions"])


def normalize_name(text: str) -> str:
    """Nettoie une chaîne : minuscules, supprime les espaces multiples et caractères spéciaux."""
    if not text:
        return ""
    text = text.lower().strip()
    return re.sub(r'\s+', ' ', text)


@router.get("/submissions-status")
def get_submissions_status(
    level: str = Query(..., description="Niveau de la classe (L1, L2, L3, M1, M2)"),
    db: Session = Depends(get_db)
):
    """
    1. Récupère la liste Roster officielle si elle existe.
    2. Sinon, auto-détecte tous les Users enregistrés dans ce niveau.
    3. Effectue un matching dynamique et renvoie le statut des dépôts.
    """
    # 1. Récupérer les étudiants inscrits sur la plateforme pour ce niveau
    db_students = db.query(User).filter(
        User.role == "student",
        User.level == level
    ).all()

    # 2. Récupérer le Roster officiel importé (s'il existe pour ce niveau)
    roster_entries = db.query(StudentRoster).filter(StudentRoster.level == level).all()

    # 3. Récupérer les projets du niveau avec l'owner préchargé
    projects = (
        db.query(Project)
        .options(joinedload(Project.owner))
        .filter(Project.level == level)
        .order_by(Project.created_at.desc())
        .all()
    )

    # Indexer le dernier projet déposé par chaque User (par owner_id)
    user_projects = {}
    for p in projects:
        if p.owner_id and p.owner_id not in user_projects:
            user_projects[p.owner_id] = p

    # --- CAS A : Aucun fichier Roster n'a été importé -> On liste les inscrits DB ---
    if not roster_entries:
        response = []
        for u in db_students:
            project = user_projects.get(u.id)
            has_deposited = project is not None
            response.append({
                "first_name": u.first_name,
                "last_name": u.last_name,
                "email": u.email,
                "has_deposited": has_deposited,
                "deposited_at": project.created_at.isoformat() if has_deposited and project.created_at else None,
                "project_title": project.title if has_deposited else None,
                "project_id": project.id if has_deposited else None
            })
        return sorted(response, key=lambda x: x["last_name"].upper())

    # --- CAS B : Un Roster officiel existe -> Matching dynamique intelligent ---
    response = []
    for entry in roster_entries:
        e_first = normalize_name(entry.first_name)
        e_last = normalize_name(entry.last_name)

        matched_user = None
        for u in db_students:
            u_first = normalize_name(u.first_name)
            u_last = normalize_name(u.last_name)

            # Test 1 : Match exact Prénom/Nom ou Nom/Prénom
            if (e_first == u_first and e_last == u_last) or (e_first == u_last and e_last == u_first):
                matched_user = u
                break
            
            # Test 2 : Si le nom complet match la chaîne entière (ex: nom composé ou inversion)
            full_entry = f"{e_first} {e_last}"
            full_user = f"{u_first} {u_last}"
            reverse_user = f"{u_last} {u_first}"
            if full_entry == full_user or full_entry == reverse_user:
                matched_user = u
                break

        project = user_projects.get(matched_user.id) if matched_user else None
        has_deposited = project is not None

        response.append({
            "first_name": entry.first_name,
            "last_name": entry.last_name,
            "email": matched_user.email if matched_user else "Compte non créé",
            "has_deposited": has_deposited,
            "deposited_at": project.created_at.isoformat() if has_deposited and project.created_at else None,
            "project_title": project.title if has_deposited else None,
            "project_id": project.id if has_deposited else None
        })

    return sorted(response, key=lambda x: x["last_name"].upper())


@router.post("/roster/upload")
async def upload_roster(
    level: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Importation de la liste officielle via un simple fichier .txt (1 nom par ligne).
    """
    contents = await file.read()
    
    try:
        text_data = contents.decode("utf-8")
    except UnicodeDecodeError:
        text_data = contents.decode("latin-1")
        
    lines = [line.strip() for line in text_data.splitlines() if line.strip()]
    if not lines:
        raise HTTPException(status_code=400, detail="Le fichier est vide.")

    # Vider le roster actuel uniquement pour cette classe
    db.query(StudentRoster).filter(StudentRoster.level == level).delete()
    
    students_to_add = []
    for line in lines:
        parts = line.replace(",", " ").split()
        if len(parts) >= 2:
            first_name = parts[0].strip()
            last_name = " ".join(parts[1:]).strip()
        else:
            first_name = line.strip()
            last_name = ""

        students_to_add.append(
            StudentRoster(
                first_name=first_name,
                last_name=last_name,
                level=level
            )
        )

    db.add_all(students_to_add)
    db.commit()

    return {
        "status": "success",
        "message": f"{len(students_to_add)} étudiants enregistrés dans la liste officielle {level}."
    }