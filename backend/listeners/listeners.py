from sqlalchemy import event, func, case
from models.sql_models import Project, User, Like

# CONFIGURATION DU BARÈME & DES LIGUES
POINTS_PER_LIKE = 2
MAX_LIKE_POINTS_PER_PROJECT = 20  # Plafond : 10 likes maximum par projet (10 * 2 = 20 pts)

PROJECT_TYPE_BONUS = {
    "academic": 2,
    "personal": 3,
    "group": 3,
    "final_year": 4,  # Ajuste la clé textuelle selon ton select Front-end
}

def get_project_total_points(target_project):
    """Calcule la valeur initiale d'un projet : Nora Score + Bonus lié au type de projet"""
    base_score = target_project.nora_score if target_project.nora_score else 50
    p_type = target_project.project_type
    type_bonus = PROJECT_TYPE_BONUS.get(p_type, 2)
    return base_score + type_bonus

def get_rank_title_case_expression(points_expression):
    """
    Génère dynamiquement une condition SQL 'CASE' pour mettre à jour rank_title
    directement au niveau de la base de données de manière atomique.
    """
    return case(
        (points_expression >= 1600, "Singularity Overlord"),
        (points_expression >= 900,  "Predictive Nexus"),
        (points_expression >= 400,  "Neural Architect"),
        (points_expression >= 100,  "Model Optimizer"),
        else_="Prompt Apprentice"
    )


# 1. ÉVÉNEMENTS SUR LES PROJETS

@event.listens_for(Project, 'after_insert')
def incr_user_project_stats(mapper, connection, target):
    """Ajoute les points d'un projet et ajuste le rang de l'auteur."""
    project_points = get_project_total_points(target)
    new_total_points = User.total_points + project_points

    connection.execute(
        User.__table__.update()
        .where(User.id == target.owner_id)
        .values(
            project_count=User.project_count + 1,
            total_points=new_total_points,
            monthly_points=User.monthly_points + project_points,
            rank_title=get_rank_title_case_expression(new_total_points) 
        )
    )

@event.listens_for(Project, 'after_delete')
def decr_user_project_stats(mapper, connection, target):
    """Retire les points d'un projet supprimé et réajuste le rang à la baisse."""
    project_points = get_project_total_points(target)
    new_total_points = func.max(0, User.total_points - project_points)

    connection.execute(
        User.__table__.update()
        .where(User.id == target.owner_id)
        .values(
            project_count=func.max(0, User.project_count - 1),
            total_points=new_total_points,
            monthly_points=func.max(0, User.monthly_points - project_points),
            rank_title=get_rank_title_case_expression(new_total_points) 
        )
    )


# 2. ÉVÉNEMENTS SUR LES LIKES

@event.listens_for(Like, 'after_insert')
def after_like_insert(mapper, connection, target):
    """Ajoute +2 points au créateur du projet si le plafond des 10 likes n'est pas atteint."""
    # Récupération de l'auteur du projet ciblé
    project = connection.execute(
        Project.__table__.select().where(Project.id == target.project_id)
    ).first()
    
    if not project:
        return

    # Compte le nombre de likes cumulés sur ce projet spécifique
    like_count = connection.execute(
        func.count(Like.id).select().where(Like.project_id == target.project_id)
    ).scalar()

    # Si on est toujours sous le plafond (ex: 9 likes * 2 = 18 pts, donc ce 10ème like à +2 est valide)
    if (like_count * POINTS_PER_LIKE) <= MAX_LIKE_POINTS_PER_PROJECT:
        new_total_points = User.total_points + POINTS_PER_LIKE
        connection.execute(
            User.__table__.update()
            .where(User.id == project.owner_id)
            .values(
                like_count_received=User.like_count_received + 1,
                total_points=new_total_points,
                monthly_points=User.monthly_points + POINTS_PER_LIKE,
                rank_title=get_rank_title_case_expression(new_total_points)  # 🪐 Recalcul du rang automatique
            )
        )
    else:
        # Plafond atteint : On augmente le compteur de cœurs mais aucun point n'est accordé
        connection.execute(
            User.__table__.update()
            .where(User.id == project.owner_id)
            .values(like_count_received=User.like_count_received + 1)
        )

@event.listens_for(Like, 'after_delete')
def after_like_delete(mapper, connection, target):
    """Retire les points d'un like supprimé si le projet était en deçà du plafond."""
    project = connection.execute(
        Project.__table__.select().where(Project.id == target.project_id)
    ).first()
    
    if not project:
        return

    like_count = connection.execute(
        func.count(Like.id).select().where(Like.project_id == target.project_id)
    ).scalar()

    # Si le retrait fait repasser le projet sous la limite d'attribution des points
    if ((like_count + 1) * POINTS_PER_LIKE) <= MAX_LIKE_POINTS_PER_PROJECT:
        new_total_points = func.max(0, User.total_points - POINTS_PER_LIKE)
        connection.execute(
            User.__table__.update()
            .where(User.id == project.owner_id)
            .values(
                like_count_received=func.max(0, User.like_count_received - 1),
                total_points=new_total_points,
                monthly_points=func.max(0, User.monthly_points - POINTS_PER_LIKE),
                rank_title=get_rank_title_case_expression(new_total_points) 
            )
        )
    else:
        # On réduit uniquement le compteur visuel global de l'étudiant
        connection.execute(
            User.__table__.update()
            .where(User.id == project.owner_id)
            .values(like_count_received=func.max(0, User.like_count_received - 1))
        )