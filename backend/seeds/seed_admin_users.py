import os
from sqlalchemy.orm import Session
from models.sql_models import User  
from config.database import SessionLocal   
from utils.auth_utils import hash_password  

def seed_admin_users():
    """
    Verifie l'existence des administrateurs et les cree s'ils n'existent pas.
    """
    db: Session = SessionLocal()
    try:
        print("Verification et amorcage des comptes administratifs...")

        # 1. CONFIGURATION DU SUPERADMIN
        superadmin_email = "superadmin@dit.sn"  
        superadmin_exists = db.query(User).filter(User.email == superadmin_email).first()

        if not superadmin_exists:
            new_superadmin = User(
                username="superadmin",
                first_name="Super",
                last_name="Admin",
                email=superadmin_email,
                password_hash=hash_password("SuperAdminNora2026!"), 
                role="superadmin",
                has_accepted_terms=True,
                rank_title="Singularity Overlord", 
                project_count=0,
                total_points=2000,   
                monthly_points=0
            )
            db.add(new_superadmin)
            print("Compte [SUPERADMIN] cree avec succes !")
        else:
            print("Le compte [SUPERADMIN] existe deja.")

        # 2. CONFIGURATION DE L'ADMIN STANDARD (Base sur ton JSON de test)
        admin_email = "stevens@dit.sn"
        admin_exists = db.query(User).filter(User.email == admin_email).first()

        if not admin_exists:
            new_admin = User(
                username="stevens_zane",
                first_name="stevens",
                last_name="zane",
                email=admin_email,
                password_hash=hash_password("admin123"),
                role="admin",
                has_accepted_terms=True,
                rank_title="Neural Architect",
                project_count=0,
                total_points=400,
                monthly_points=0
            )
            db.add(new_admin)
            print("Compte [ADMIN] cree avec succes !")
        else:
            print("Le compte [ADMIN] existe deja.")

        db.commit()

    except Exception as e:
        db.rollback()
        print(f"Erreur lors du seeding de la BDD : {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_admin_users()