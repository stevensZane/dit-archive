from datetime import datetime
from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, DateTime, Text, Table, Float
from sqlalchemy.orm import relationship
from config.database import Base

# Table de liaison Many-to-Many pour les technologies
project_technologies = Table(
    "project_technologies",
    Base.metadata,
    Column("project_id", Integer, ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True),
    Column("technology_id", Integer, ForeignKey("technologies.id", ondelete="CASCADE"), primary_key=True))

class Program(Base):
    __tablename__ = "programs"
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, nullable=False)
    projects = relationship("Project", back_populates="program")

class AcademicYear(Base):
    __tablename__ = "academic_years"
    id = Column(Integer, primary_key=True)
    label = Column(String, unique=True, nullable=False)
    projects = relationship("Project", back_populates="academic_year")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    avatar_url = Column(String, nullable=True)
    username = Column(String, unique=True, index=True, nullable=True)
    last_seen = Column(String, nullable=True)
    
    # --- RGPD & Sécurité IA ---
    has_accepted_terms = Column(Boolean, default=False)
    terms_accepted_at = Column(DateTime, nullable=True) # Preuve légale de la date d'acceptation

    # --- Gestion des Rôles (RBAC) ---
    # Valeurs possibles : 'student', 'guest', 'admin', 'superadmin'
    role = Column(String, default="student", nullable=False) 
    
    # --- Données Académiques (Optionnelles car un Guest/Admin n'en a pas) ---
    level = Column(String, nullable=True) 
    program_id = Column(Integer, ForeignKey("programs.id"), nullable=True)
    academic_year_id = Column(Integer, ForeignKey("academic_years.id"), nullable=True)

    # --- Analytics & Leaderboard Boosté ---
    total_points = Column(Integer, default=0)
    monthly_points = Column(Integer, default=0) # Pour animer les challenges du mois !
    project_count = Column(Integer, default=0)  # Évite les sous-requêtes lourdes
    like_count_received = Column(Integer, default=0) # Popularité / Qualité
    rank_title = Column(String, default="Débutant")
    
    # --- Relations ---
    projects = relationship("Project", back_populates="owner")
    comments = relationship("Comment", back_populates="user")
    likes = relationship("Like", back_populates="user")
    feedbacks = relationship("Feedback", back_populates="user", cascade="all, delete-orphan")
    
    @property
    def league_rank(self) -> dict:
        """
        Calcule dynamiquement la ligue de l'étudiant à la volée.
        Renvoie le nom et l'icône associés pour que le Front-end puisse l'afficher directement.
        """
        points = self.total_points if self.total_points else 0
        
        if points <= 100:
            return {"name": "Prompt Apprentice", "badge": "🧪", "next_tier": 101}
        elif points <= 400:
            return {"name": "Model Optimizer", "badge": "🛡️", "next_tier": 401}
        elif points <= 900:
            return {"name": "Neural Architect", "badge": "⚡", "next_tier": 901}
        elif points <= 1600:
            return {"name": "Predictive Nexus", "badge": "🔮", "next_tier": 1601}
        else:
            return {"name": "Singularity Overlord", "badge": "🌌", "next_tier": None}

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    project_type = Column(String(50), nullable=False, default="academic")
    
    analysis_status = Column(String, default="pending") 
    is_historical = Column(Boolean, default=False)
    
    report_pdf_url = Column(String, nullable=True) 
    screenshots = Column(Text, nullable=True) 
    
    github_repository_url = Column(String, nullable=True)
    readme_content = Column(Text, nullable=True) 
    primary_language = Column(String, nullable=True) 
    technologies_list = Column(String, nullable=True)
    ai_summary = Column(Text, nullable=True) 
    nora_score = Column(Float, default=0.0) 

    views_count = Column(Integer, default=0)
    downloads_count = Column(Integer, default=0)
    
    level = Column(String) 
    academic_year_id = Column(Integer, ForeignKey("academic_years.id"))
    program_id = Column(Integer, ForeignKey("programs.id"))
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    author_name = Column(String, nullable=True)

    academic_year = relationship("AcademicYear", back_populates="projects")
    program = relationship("Program", back_populates="projects")
    owner = relationship("User", back_populates="projects")
    comments = relationship("Comment", back_populates="project", cascade="all, delete-orphan")
    likes = relationship("Like", back_populates="project", cascade="all, delete-orphan")
    files = relationship("ProjectFile", back_populates="project", cascade="all, delete-orphan")
    technologies = relationship("Technology", secondary=project_technologies, back_populates="projects")
    
class ProjectFile(Base):
    __tablename__ = "project_files"
    id = Column(Integer, primary_key=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"))
    file_name = Column(String, nullable=False)
    github_path = Column(String, nullable=False)
    file_type = Column(String) 
    file_size = Column(Float, nullable=True) 
    is_cleaned = Column(Boolean, default=False)

    project = relationship("Project", back_populates="files")

class Technology(Base):
    __tablename__ = "technologies"
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, nullable=False)
    projects = relationship("Project", secondary=project_technologies, back_populates="technologies")

class Comment(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"))
    user_id = Column(Integer, ForeignKey("users.id"))
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    project = relationship("Project", back_populates="comments")
    user = relationship("User", back_populates="comments")

class Like(Base):
    __tablename__ = "likes"
    id = Column(Integer, primary_key=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"))
    user_id = Column(Integer, ForeignKey("users.id"))
    
    project = relationship("Project", back_populates="likes")
    user = relationship("User", back_populates="likes")

class Feedback(Base):
    __tablename__ = "feedbacks"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True) # Nullable si un guest non connecté écrit
    
    type = Column(String, nullable=False) # 'bug', 'suggestion', 'autre' (lié à ton front !)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Pour l'équipe technique : suivre si le bug est traité
    is_resolved = Column(Boolean, default=False)
    admin_notes = Column(Text, nullable=True)

    user = relationship("User", back_populates="feedbacks")

class ConversationLog(Base):
    """
    Sauvegarde ANONYME des interactions avec Nora.
    Respecte la Section 2 (Anonymisation & RBAC) tout en permettant 
    des analyses poussées par Filière, Niveau et Rôle.
    """
    __tablename__ = "conversation_logs"
    
    id = Column(Integer, primary_key=True)
    chat_id = Column(String, nullable=False) # Permet de regrouper les messages d'une MÊME session sans savoir qui parle
    
    # --- Contenu de l'échange ---
    user_prompt = Column(Text, nullable=False)
    ai_response = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # --- Métadonnées IA pour l'entraînement sémantique ---
    detected_language = Column(String, nullable=True) # 'fr', 'en'
    has_negative_feedback = Column(Boolean, default=False) # Si l'utilisateur met un pouce rouge
    
    # ============================================================
    #  LE COEUR DE L'ANALYSE : Le contexte sans l'identité (RGPD)
    # ============================================================
    
    # Savoir 'QUI FAIT QUOI' par catégorie (RBAC)
    user_role = Column(String, nullable=False) # 'student', 'guest', 'admin'
    
    # Analyses spécifiques par classe et filière (Nullable pour les Guests/Admins)
    user_level = Column(String, nullable=True) # 'L1', 'L2', 'L3', 'M1', 'M2'
    program_name = Column(String, nullable=True) # Stocke directement le nom de la filière (ex: 'Génie Logiciel', 'Data Science')
    academic_year_label = Column(String, nullable=True) # Stocke la promo (ex: '2025-2026')

    # --- Tags d'analyse automatique (Remplis par un script ou un LLM en tâche de fond) ---
    extracted_keywords = Column(String, nullable=True) # Ex: "Docker, Déploiement, Erreur 500"
    category_topic = Column(String, nullable=True) # Ex: "Infrastructure", "Algorithmique", "Recherche d'archive"

class ProjectInteraction(Base):
    __tablename__ = "project_interactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Nullable si jamais un vieux log n'a pas d'user
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"))
    interaction_type = Column(String(20))  # 'view' ou 'download'
    created_at = Column(DateTime, default=datetime.utcnow)