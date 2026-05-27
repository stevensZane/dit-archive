import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Chargement des variables d'environnement
load_dotenv()

# Configuration du moteur SQLAlchemy
engine = create_engine(os.getenv("DATABASE_URL"))

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