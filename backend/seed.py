import random
from datetime import datetime, timedelta
from sqlalchemy import text
from database import SessionLocal, Base, engine, User, Program, AcademicYear, Project, ProjectFile, Comment, Like
from auth_utils import hash_password # Assure-toi que cette fonction utilise pwd_context.hash()

def seed_db():
    db = SessionLocal()
    
    print("🧹 Nettoyage et recréation de la base...")
    # On désactive les contraintes pour un drop propre sur Postgres
    db.execute(text("DROP SCHEMA public CASCADE; CREATE SCHEMA public;"))
    db.commit()
    
    Base.metadata.create_all(bind=engine)

    # 1. ANNÉES ACADÉMIQUES
    print("📅 Insertion des années...")
    years = [AcademicYear(label=f"{2020+i}-{2021+i}") for i in range(5)]
    db.add_all(years)
    db.flush() 

    # 2. FILIÈRES (Programs)
    print("🎓 Insertion des filières...")
    prog_names = ["Big Data & IA", "Génie Logiciel", "Systèmes & Réseaux", "Cyber-sécurité", "Management Digital"]
    programs = [Program(name=name) for name in prog_names]
    db.add_all(programs)
    db.flush()

    # 3. UTILISATEURS
    print("👥 Insertion des utilisateurs (avec vrais hashs)...")
    users = []
    # Admin (Compte staff)
    users.append(User(
        first_name="Admin", last_name="DIT", 
        email="admin@dit.sn", 
        password_hash=hash_password("admin123"), 
        role="admin", level="Staff"
    ))
    
    # Étudiant de test fixe (pour ton login React)
    users.append(User(
        first_name="Jean", last_name="Dupont", 
        email="etudiant@dit.sn", 
        password_hash=hash_password("password123"), 
        role="student", level="L3",
        program_id=programs[1].id, # Génie Logiciel
        academic_year_id=years[-1].id
    ))

    first_names = ["Moussa", "Fatou", "Amadou", "Awa", "Ousmane", "Khady", "Cheikh", "Mariama"]
    last_names = ["Diop", "Ndiaye", "Sow", "Fall", "Ba", "Gueye", "Kane"]
    
    for i in range(10):
        fn = random.choice(first_names)
        ln = random.choice(last_names)
        users.append(User(
            first_name=fn, last_name=ln, 
            email=f"{fn.lower()}.{ln.lower()}{i}@student.sn",
            password_hash=hash_password("pass123"),
            role="student",
            level=random.choice(["L3", "M1", "M2"]),
            program_id=random.choice(programs).id,
            academic_year_id=years[-1].id
        ))
    db.add_all(users)
    db.flush()

    # 4. PROJETS
    print("🚀 Insertion des projets (Nora-style)...")
    titles = [
        "Gestion Pharmacie", "Bio-Scanner IA", "Portail Scolaire", "Audit Sécu DIT", 
        "Data Viz Covid", "Bot Telegram DIT", "App Transport", "E-Commerce Bio",
        "Analyse Sentiment Twitter", "Smart Home IoT", "Crypto Wallet", "Système Vote Blockchain"
    ]
    
    tech_stacks = [
        "Python, FastAPI, PostgreSQL", "React, Node.js, MongoDB", 
        "Python, TensorFlow, Flask", "Java, Spring Boot, MySQL",
        "Docker, AWS, Kubernetes", "Vue.js, Firebase"
    ]

    projects = []
    for i in range(20):
        is_hist = i < 8
        prog = random.choice(programs)
        year = random.choice(years)
        
        new_p = Project(
            title=titles[i % len(titles)] + (f" v{i}" if i > 10 else ""),
            description=f"Description du projet {titles[i % len(titles)]}. Analyse effectuée par Nora.",
            status="archived" if is_hist else random.choice(["pending", "archived"]),
            upload_method="github",
            level=random.choice(["L3", "M1", "M2"]),
            github_repository_url="https://github.com/dit-archive/test-repo",
            # ICI : On remplit la string directement, plus besoin de la table de liaison
            technologies_list=random.choice(tech_stacks),
            primary_language=random.choice(["Python", "JavaScript", "Java"]),
            author_name=f"Alumni DIT {i}" if is_hist else None,
            owner_id=None if is_hist else random.choice(users[1:]).id,
            is_historical=is_hist,
            program_id=prog.id,
            academic_year_id=year.id,
            readme_content="# Readme\nSimulation de contenu GitHub.",
            ai_summary="Projet analysé. Score de qualité : 85/100.",
            created_at=datetime.utcnow() - timedelta(days=random.randint(0, 500))
        )
        projects.append(new_p)
    
    db.add_all(projects)
    db.flush()

    # 5. FICHIERS & SOCIAL
    print("💬 Finalisation (Fichiers & Likes)...")
    for p in projects:
        # Simulation du rapport PDF
        p.report_pdf_url = f"archives/reports/report_{p.id}.pdf"
        
        # Un petit commentaire par projet
        db.add(Comment(
            project_id=p.id,
            user_id=users[0].id,
            content="Projet validé par le département."
        ))

    db.commit()
    print("\n✅ SEEDING TERMINÉ !")
    print(f"👉 Login: etudiant@dit.sn / password123")
    db.close()

if __name__ == "__main__":
    seed_db()