import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from database import SessionLocal, Base, engine, User, Program, AcademicYear, Technology, Project, ProjectFile, Comment, Like
from auth_utils import hash_password

def seed_db():
    db = SessionLocal()
    
    print("🧹 Nettoyage et recréation de la base...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    # 1. ANNÉES ACADÉMIQUES
    print("📅 Insertion des années...")
    years = [AcademicYear(label=f"{2020+i}-{2021+i}") for i in range(5)]
    db.add_all(years)
    db.flush() # Pour récupérer les IDs sans commit total

    # 2. FILIÈRES (Programs)
    print("🎓 Insertion des filières...")
    prog_names = ["Big Data & IA", "Génie Logiciel", "Systèmes & Réseaux", "Cyber-sécurité", "Management Digital"]
    programs = [Program(name=name) for name in prog_names]
    db.add_all(programs)
    db.flush()

    # 3. TECHNOLOGIES
    print("💻 Insertion des technos...")
    tech_list = ["Python", "React", "Docker", "PostgreSQL", "TensorFlow", "Node.js", "FastAPI", "AWS", "Vue.js", "MongoDB"]
    technos = [Technology(name=name) for name in tech_list]
    db.add_all(technos)
    db.flush()

    # 4. UTILISATEURS (Actifs)
    print("👥 Insertion des utilisateurs...")
    users = []
    # Admins
    users.append(User(first_name="Admin", last_name="DIT", email="admin@dit.sn", password_hash=hash_password("admin123"), role="admin", level="Staff"))
    # Étudiants (5 par filière environ)
    first_names = ["Moussa", "Fatou", "Amadou", "Awa", "Ousmane", "Khady", "Cheikh", "Mariama"]
    last_names = ["Diop", "Ndiaye", "Sow", "Fall", "Ba", "Gueye", "Kane"]
    
    for i in range(15):
        fn = random.choice(first_names)
        ln = random.choice(last_names)
        users.append(User(
            first_name=fn, last_name=ln, 
            email=f"{fn.lower()}.{ln.lower()}{i}@student.sn",
            password_hash=hash_password("pass123"),
            role="student",
            level=random.choice(["L1", "L2", "L3", "M1", "M2"]),
            program_id=random.choice(programs).id,
            academic_year_id=years[-1].id # Tous en année courante
        ))
    db.add_all(users)
    db.flush()

    # 5. PROJETS (20+)
    print("🚀 Insertion de 20+ projets (actuels et historiques)...")
    projects = []
    titles = [
        "Gestion Pharmacie", "Bio-Scanner IA", "Portail Scolaire", "Audit Sécu DIT", 
        "Data Viz Covid", "Bot Telegram DIT", "App Transport", "E-Commerce Bio",
        "Analyse Sentiment Twitter", "Smart Home IoT", "Crypto Wallet", "Système Vote Blockchain",
        "Gestion Stock Entrepôt", "Reconnaissance Faciale", "Proxy Filtrant", "Monitoring Serveurs",
        "Réseau Social Privé", "Gestion Budget Perso", "Streaming Local", "Task Manager Pro"
    ]

    for i in range(25):
        is_hist = i < 10 # Les 10 premiers sont historiques
        prog = random.choice(programs)
        year = random.choice(years)
        
        new_p = Project(
            title=titles[i % len(titles)] + (f" v{i}" if i > 19 else ""),
            description=f"Ceci est une description détaillée pour le projet {titles[i % len(titles)]}.",
            status="archived" if is_hist else random.choice(["approved", "pending"]),
            upload_method="historical_admin" if is_hist else "zip",
            level=random.choice(["L3", "M1", "M2"]),
            primary_language=random.choice(["Python", "JavaScript", "C++", "Java"]),
            is_historical=is_hist,
            author_name=f"Ancien Elève {i}" if is_hist else None,
            owner_id=None if is_hist else random.choice(users[1:]).id,
            program_id=prog.id,
            academic_year_id=year.id,
            readme_content=f"# {titles[i % len(titles)]}\nCe projet utilise les dernières technos...",
            ai_summary="Résumé généré par Nora : Ce projet traite de l'optimisation des flux...",
            created_at=datetime.utcnow() - timedelta(days=random.randint(0, 730))
        )
        # Assigner 2-3 technos par projet
        new_p.technologies = random.sample(technos, k=random.randint(1, 3))
        projects.append(new_p)
    
    db.add_all(projects)
    db.flush()

    # 6. FICHIERS & RAPPORTS
    print("📂 Liaison des fichiers et rapports...")
    for p in projects:
        # On ajoute toujours un rapport PDF (surtout pour Nora)
        p.has_report = True
        p.report_pdf_url = f"archives/{p.academic_year.label}/{p.program.name.replace(' ', '_')}/{p.id}/rapport.pdf"
        
        # Si c'est pas historique, on simule un code source
        if not p.is_historical:
            db.add(ProjectFile(
                project_id=p.id,
                file_name="source_code.zip",
                github_path=f"archives/{p.id}/code.zip",
                file_size=random.uniform(0.5, 15.0),
                is_cleaned=True
            ))

    # 7. SOCIAL (Likes et Commentaires pour faire vivant)
    print("💬 Ajout de l'activité sociale...")
    for _ in range(30):
        db.add(Comment(
            project_id=random.choice(projects).id,
            user_id=random.choice(users).id,
            content=random.choice(["Super projet !", "Beau boulot sur la tech", "Interessant comme approche", "Nora, analyse ce code !"])
        ))
        db.add(Like(
            project_id=random.choice(projects).id,
            user_id=random.choice(users).id
        ))

    db.commit()
    print("\n✅ --- SEEDING TERMINÉ : 25 projets, 16 utilisateurs, archives historiques incluses ! ---")
    db.close()

if __name__ == "__main__":
    seed_db()