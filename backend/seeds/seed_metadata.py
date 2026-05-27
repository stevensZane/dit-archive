from sqlalchemy.orm import Session
from config.database import SessionLocal, engine, Base  
from models.sql_models import Technology, Program, AcademicYear  

def seed_metadata():
    db: Session = SessionLocal()
    
    try:
        # Sécurité : Création des tables si elles n'existent pas
        Base.metadata.create_all(bind=engine)

        # 1. GENERATION DYNAMIQUE DES ANNEES ACADEMIQUES (2019 à 2040)
        years = []
        for start_year in range(2019, 2040):
            end_year = start_year + 1
            years.append(f"{start_year}-{end_year}")

        for year_label in years:
            exists = db.query(AcademicYear).filter(AcademicYear.label == year_label).first()
            if not exists:
                db.add(AcademicYear(label=year_label))

        # 2. PEUPLEMENT DES FILIÈRES (PROGRAMS)
        programs = [
            "Big Data & Intelligence Artificielle", 
            "Marketing Digital", 
        ]
        for prog_name in programs:
            exists = db.query(Program).filter(Program.name == prog_name).first()
            if not exists:
                db.add(Program(name=prog_name))

        # 3. PEUPLEMENT DES TECHNOLOGIES
        technologies = [
            "React", "Vue.js", "Angular", "Next.js", 
            "FastAPI", "Django", "Node.js", "Spring Boot",
            "PostgreSQL", "MongoDB", "MySQL", "ChromaDB",
            "Python", "JavaScript", "TypeScript", "Docker", "Kubernetes"
        ]
        for tech_name in technologies:
            exists = db.query(Technology).filter(Technology.name == tech_name).first()
            if not exists:
                db.add(Technology(name=tech_name))

        # Sauvegarde globale
        db.commit()

    except Exception as e:
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_metadata()