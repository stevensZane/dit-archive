import os
from datetime import datetime
from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, Boolean, DateTime, Text, Table, Float
from sqlalchemy.orm import sessionmaker, relationship, declarative_base

load_dotenv()

engine = create_engine(os.getenv("DATABASE_URL"))
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Table de liaison Many-to-Many pour les technos
project_technologies = Table(
    "project_technologies",
    Base.metadata,
    Column("project_id", Integer, ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True),
    Column("technology_id", Integer, ForeignKey("technologies.id", ondelete="CASCADE"), primary_key=True)
)

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
    password_hash = Column(String, nullable=False)
    role = Column(String, default="student") 
    level = Column(String) # Niveau actuel de l'étudiant
    program_id = Column(Integer, ForeignKey("programs.id"))
    academic_year_id = Column(Integer, ForeignKey("academic_years.id"))

    projects = relationship("Project", back_populates="owner")
    comments = relationship("Comment", back_populates="user")
    likes = relationship("Like", back_populates="user")

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    status = Column(String, default="pending") 
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # --- GitHub & Metadata (Le nouveau cœur) ---
    upload_method = Column(String, default="github") # On privilégie github
    github_repository_url = Column(String, nullable=True)
    report_pdf_url = Column(String, nullable=True)
    readme_content = Column(Text, nullable=True) # Stocké pour les recherches de Nora
    primary_language = Column(String, nullable=True) # Récupéré via API GitHub
    technologies_list = Column(String, nullable=True)
    ai_summary = Column(Text, nullable=True) # Le résumé généré par Nora
    is_historical = Column(Boolean, default=False)
    rejection_reason = Column(Text, nullable=True)
    
    # --- Organisation ---
    level = Column(String) # L1, L2, L3, M1, M2
    academic_year_id = Column(Integer, ForeignKey("academic_years.id"))
    program_id = Column(Integer, ForeignKey("programs.id"))
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    author_name = Column(String, nullable=True) # Pour les archives historiques sans User lié
    
    # --- Relations ---
    academic_year = relationship("AcademicYear", back_populates="projects")
    program = relationship("Program", back_populates="projects")
    owner = relationship("User", back_populates="projects")
    # On garde les fichiers pour stocker uniquement les rapports PDF
    files = relationship("ProjectFile", back_populates="project", cascade="all, delete-orphan")
    technologies = relationship("Technology", secondary=project_technologies, back_populates="projects")
    comments = relationship("Comment", back_populates="project", cascade="all, delete-orphan")
    likes = relationship("Like", back_populates="project", cascade="all, delete-orphan")
    
class ProjectFile(Base):
    __tablename__ = "project_files"
    id = Column(Integer, primary_key=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"))
    
    file_name = Column(String, nullable=False) # Ex: "Rapport_Final.pdf"
    github_path = Column(String, nullable=False)  # Lien Cloudinary, S3, ou ton stockage local
    file_type = Column(String) # "report" | "presentation" | "other"
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

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        
