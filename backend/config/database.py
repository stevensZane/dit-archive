import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Chargement des variables d'environnement
load_dotenv()

# Configuration sécurisée du moteur SQLAlchemy pour Neon (Serverless)
engine = create_engine(
    os.getenv("DATABASE_URL"),
    pool_size=5,                  # Nombre maximum de connexions persistantes ouvertes
    max_overflow=10,              # Connexions temporaires supplémentaires en cas de pic de trafic
    pool_recycle=1800,            # Recrée proprement les connexions toutes les 30 minutes (évite la veille de Neon)
    pool_pre_ping=True            # Teste la connexion avant CHAQUE requête. Si Neon dormait, SQLAlchemy la relance en douce.
)

# Configuration de la fabrique de sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Déclaration de la classe de base pour les futurs modèles SQL
Base = declarative_base()

# Dépendance FastAPI pour injecter la session de manière sécurisée
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()