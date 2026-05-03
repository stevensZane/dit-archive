import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base, User, Project, Program, AcademicYear, Technology, Comment, Like, ProjectFile

# Simulation d'une fonction de hashage (Remplace par ton vrai import si nécessaire)
from auth_utils import hash_password 

def seed_db():
    db = Session()
    db = SessionLocal()

    print("--- 🗑 Nettoyage de la base de données ---")
    # Optionnel : décommente si tu veux reset à chaque fois
    # Base.metadata.drop_all(bind=engine)
    # Base.metadata.create_all(bind=engine)

    try:
        # 1. ANNÉES ACADÉMIQUES
        print("📅 Insertion des années...")
        years_labels = ["2022-2023", "2023-2024", "2024-2025"]
        years = []
        for label in years_labels:
            y = AcademicYear(label=label)
            db.add(y)
            years.append(y)
        db.flush()

        # 2. FILIÈRES
        print("🎓 Insertion des filières...")
        prog_names = ["Big Data & IA", "Génie Logiciel", "Cyber-sécurité", "Systèmes & Réseaux"]
        programs = []
        for name in prog_names:
            p = Program(name=name)
            db.add(p)
            programs.append(p)
        db.flush()

        # 3. TECHNOLOGIES
        print("🛠 Insertion des technologies...")
        tech_names = ["Python", "React", "FastAPI", "PostgreSQL", "Docker", "TensorFlow", "Node.js"]
        techs = []
        for name in tech_names:
            t = Technology(name=name)
            db.add(t)
            techs.append(t)
        db.flush()

        # 4. UTILISATEURS (1 Admin + 4 Students)
        print("👥 Insertion des utilisateurs...")
        users = []
        
        # Admin
        admin = User(
            first_name="Admin", last_name="Nora",
            email="admin@dit.sn", password_hash=hash_password("admin123"),
            role="admin", level="Staff",
            program_id=programs[0].id, academic_year_id=years[-1].id
        )
        db.add(admin)
        users.append(admin)

        # Étudiants
        names = [("Moussa", "Diop"), ("Fatou", "Sow"), ("Amadou", "Fall"), ("Awa", "Ndiaye")]
        for fn, ln in names:
            u = User(
                first_name=fn, last_name=ln,
                email=f"{fn.lower()}@dit.sn", password_hash=hash_password("pass123"),
                role="student", level=random.choice(["L3", "M1", "M2"]),
                program_id=random.choice(programs).id,
                academic_year_id=years[-1].id,
                total_points=random.randint(50, 500)
            )
            db.add(u)
            users.append(u)
        db.flush()

        # 5. PROJETS (10 projets)
        print("🚀 Insertion des projets...")
        project_titles = [
            "Analyse de sentiments Twitter", "Système de gestion de stock", 
            "IA de détection de maladies", "Plateforme E-learning DIT", 
            "Blockchain pour le cadastre", "Application de télémédecine",
            "Scanner de vulnérabilités réseau", "Dashboard Analytics RH",
            "Chatbot d'assistance étudiant", "Automatisation de serre IoT"
        ]

        projects = []
        for i in range(10):
            owner = random.choice(users[1:]) # Un étudiant
            prog = db.query(Program).get(owner.program_id)
            
            p = Project(
                title=project_titles[i],
                description=f"Ceci est une description détaillée du projet {project_titles[i]}. Un projet innovant réalisé au DIT.",
                analysis_status="completed",
                is_historical=random.choice([True, False]),
                github_repository_url="https://github.com/dit-archive/test-repo",
                primary_language=random.choice(["Python", "JavaScript", "Java"]),
                technologies_list="React, FastAPI, Docker",
                nora_score=round(random.uniform(70.0, 95.0), 2),
                owner_id=owner.id,
                program_id=owner.program_id,
                academic_year_id=owner.academic_year_id,
                level=owner.level,
                views_count=random.randint(10, 100),
                created_at=datetime.utcnow() - timedelta(days=random.randint(1, 100))
            )
            
            # Associer des technologies (Many-to-Many)
            p.technologies = random.sample(techs, 3)
            
            db.add(p)
            projects.append(p)
        db.flush()

        # 6. FICHIERS, LIKES & COMMENTAIRES
        print("💬 Finalisation (Fichiers & Interaction)...")
        for p in projects:
            # Ajout d'un fichier rapport
            file = ProjectFile(
                project_id=p.id,
                file_name="rapport_final.pdf",
                github_path=f"https://cloudinary.com/dit/{p.id}/report.pdf",
                file_type="report",
                file_size=2.4
            )
            db.add(file)

            # Ajout de likes aléatoires
            for _ in range(random.randint(1, 4)):
                db.add(Like(project_id=p.id, user_id=random.choice(users).id))
            
            # Ajout d'un commentaire admin
            db.add(Comment(
                project_id=p.id, 
                user_id=admin.id, 
                content="Excellent travail, la structure du code est très propre !"
            ))

        db.commit()
        print("\n✅ SEEDING TERMINÉ AVEC SUCCÈS !")
        print(f"🔑 Admin: admin@dit.sn / admin123")
        print(f"🔑 Étudiant: moussa@dit.sn / pass123")

    except Exception as e:
        print(f"💥 ERREUR : {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()