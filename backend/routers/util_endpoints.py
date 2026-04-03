from database import Program, AcademicYear, Technology, get_db
from fastapi import Depends, APIRouter
from sqlalchemy.orm import Session

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

