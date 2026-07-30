import os
import logging
from fastapi import FastAPI
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from apscheduler.schedulers.background import BackgroundScheduler

# Importations de ton projet
from config.database import engine
from models import sql_models
from routers import admin, projects, nora, util_endpoints, auth_and_users, analytics, admin_submissions, dataplace
from dotenv import load_dotenv

# Importations de tes scripts de seed
from seeds.seed_admin_users import seed_admin_users 
from seeds.seed_metadata import seed_metadata
from seeds.seed_dataplace import sync_dataplace_datasets

# les listeners
from listeners import listeners

# Configuration des logs
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("API-DIT")

load_dotenv()

# Initialisation du planificateur automatique en arrière-plan
scheduler = BackgroundScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Démarrage du backend DIT Archive...")
    
    try:
        # 1. Vérification de la connexion et activation de pgvector
        with engine.connect() as conn:
            logger.info("Connexion à la base Neon réussie. Vérification des extensions...")
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS pgvector;"))
            conn.commit()

        # 2. Crée les tables si elles n'existent pas
        logger.info("Synchronisation des modèles SQL...")
        sql_models.Base.metadata.create_all(bind=engine)
        
        # 3. Seed des admins et des métadonnées
        logger.info("Exécution du seed des administrateurs...")
        seed_admin_users()
        
        logger.info("Exécution du seed des métadonnées...")
        seed_metadata()
        
        # 4. Synchronisation initiale des datasets Dataplace
        logger.info("Synchronisation des datasets Dataplace au démarrage...")
        sync_dataplace_datasets()

        # 5. Planification automatique de la synchronisation TOUS LES 3 JOURS
        scheduler.add_job(
            sync_dataplace_datasets, 
            'interval', 
            days=3, 
            id='sync_dataplace_job',
            replace_existing=True
        )
        scheduler.start()
        logger.info("⏰ Tâche automatisée des Datasets Dataplace activée (Frequence: 3 jours).")

        logger.info("Initialisation terminée avec succès ! Le serveur est prêt.")
        
    except Exception as e:
        logger.error(f"Erreur critique lors du lifespan au démarrage : {str(e)}")
    
    yield
    
    # Arret du scheduler lors de la fermeture de l'application
    scheduler.shutdown()
    logger.info("Arrêt du backend DIT Archive...")

app = FastAPI(
    title="DIT Archive API", 
    description="API de gestion et d'archivage des projets du Dakar Institute of Technology",
    version="1.0.0",
    lifespan=lifespan
)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Route de Health Check
@app.get("/")
def health_check():
    return {
        "status": "healthy", 
        "message": "L'Archive DIT est en ligne !",
        "environment": os.getenv("RAILWAY_ENVIRONMENT", "production")
    }

# Inclusion de tous tes routeurs
app.include_router(admin.router)
app.include_router(projects.router)
app.include_router(nora.router)
app.include_router(util_endpoints.router)
app.include_router(auth_and_users.router)
app.include_router(analytics.router)
app.include_router(admin_submissions.router)
app.include_router(dataplace.router)

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    is_dev = os.getenv("RAILWAY_ENVIRONMENT") is None
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=is_dev)