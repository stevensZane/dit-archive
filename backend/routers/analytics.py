from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, Integer

from config.database import get_db
from models.sql_models import (
    Project,
    User,
    Program,
    Technology,
    ConversationLog,
    project_technologies,
)
from utils.auth_utils import require_role

router = APIRouter(
    prefix="/analytics",
    tags=["Business Intelligence & Dashboard"],
    dependencies=[Depends(require_role("admin"))],
)


@router.get("/summary")
def get_global_kpis(db: Session = Depends(get_db)):
    """KPIs Principaux (Cartes du haut)"""
    total_projects = db.query(func.count(Project.id)).scalar() or 0
    total_students = db.query(func.count(User.id)).filter(User.role == "student").scalar() or 0
    total_views = db.query(func.sum(Project.views_count)).scalar() or 0
    total_downloads = db.query(func.sum(Project.downloads_count)).scalar() or 0
    total_nora_queries = db.query(func.count(ConversationLog.id)).scalar() or 0

    return {
        "total_projects": total_projects,
        "total_students": total_students,
        "total_views": total_views,
        "total_downloads": total_downloads,
        "total_nora_queries": total_nora_queries,
    }


@router.get("/tech-stack")
def get_top_technologies(limit: int = 8, db: Session = Depends(get_db)):
    """Top 8 des Technologies les plus utilisées"""
    results = (
        db.query(Technology.name, func.count(project_technologies.c.project_id).label("total"))
        .join(project_technologies, Technology.id == project_technologies.c.technology_id)
        .group_by(Technology.name)
        .order_by(desc("total"))
        .limit(limit)
        .all()
    )
    return [{"technology": r[0], "count": r[1]} for r in results]


@router.get("/projects-by-program")
def get_projects_by_program(db: Session = Depends(get_db)):
    """Répartition des projets par Filière / Programme"""
    results = (
        db.query(Program.name, func.count(Project.id).label("total"))
        .join(Project, Program.id == Project.program_id)
        .group_by(Program.name)
        .order_by(desc("total"))
        .all()
    )
    return [{"program": r[0], "count": r[1]} for r in results]


@router.get("/projects-by-level")
def get_projects_by_level(db: Session = Depends(get_db)):
    """Répartition des projets par niveau académique (L1, L2, L3, M1, M2)"""
    results = (
        db.query(Project.level, func.count(Project.id).label("total"))
        .filter(Project.level.isnot(None))
        .group_by(Project.level)
        .order_by(Project.level)
        .all()
    )
    return [{"level": r[0] or "Non spécifié", "count": r[1]} for r in results]


@router.get("/nora-insights")
def get_nora_search_insights(limit: int = 6, db: Session = Depends(get_db)):
    """Activité de l'IA Nora par Filière"""
    results = (
        db.query(
            ConversationLog.program_name,
            func.count(ConversationLog.id).label("questions_count"),
            func.sum(func.cast(ConversationLog.has_negative_feedback, Integer)).label("unanswered_count"),
        )
        .filter(ConversationLog.program_name.isnot(None))
        .group_by(ConversationLog.program_name)
        .order_by(desc("questions_count"))
        .limit(limit)
        .all()
    )
    return [
        {
            "program": r[0],
            "total_questions": r[1],
            "negative_feedbacks": r[2] or 0,
        }
        for r in results
    ]


@router.get("/top-projects")
def get_top_performing_projects(limit: int = 5, db: Session = Depends(get_db)):
    """Top 5 des projets les plus populaires (vues + downloads)"""
    projects = (
        db.query(Project)
        .order_by(desc(Project.views_count + Project.downloads_count))
        .limit(limit)
        .all()
    )
    return [
        {
            "id": p.id,
            "title": p.title,
            "author": p.author_name or (f"{p.owner.first_name} {p.owner.last_name}" if p.owner else "Inconnu"),
            "views": p.views_count,
            "downloads": p.downloads_count,
            "nora_score": p.nora_score,
        }
        for p in projects
    ]


@router.get("/top-students")
def get_top_students(limit: int = 5, db: Session = Depends(get_db)):
    """Leaderboard des étudiants les plus actifs & récompensés"""
    students = (
        db.query(User)
        .filter(User.role == "student")
        .order_by(desc(User.total_points))
        .limit(limit)
        .all()
    )
    return [
        {
            "id": s.id,
            "name": f"{s.first_name} {s.last_name}",
            "points": s.total_points or 0,
            "project_count": s.project_count or 0,
            "likes": s.like_count_received or 0,
            "rank_title": s.rank_title or "Débutant",
            "league": s.league_rank,
            "level": s.level or "N/A"
        }
        for s in students
    ]