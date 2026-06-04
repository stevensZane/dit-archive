import os
import logging
from fastapi import FastAPI
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

# Importations de ton projet
from config.database import engine
from models import sql_models
from routers import admin, projects, nora, util_endpoints, auth_and_users
from dotenv import load_dotenv

# Importations de tes scripts de seed
from seeds.seed_admin_users import seed_admin_users 
from seeds.seed_metadata import seed_metadata

# les listeners
from listeners import listeners

# Configuration des logs pour voir exactement ce qui se passe sur Railway
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("API-DIT")

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Démarrage du backend DIT Archive...")
    
    try:
        # 1. Vérification de la connexion et activation de pgvector si nécessaire
        with engine.connect() as conn:
            logger.info("Connexion à la base Neon réussie. Vérification des extensions...")
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS pgvector;"))
            conn.commit()

        # 2. Crée les tables si elles n'existent pas en BDD
        logger.info("Synchronisation des modèles SQL...")
        sql_models.Base.metadata.create_all(bind=engine)
        
        # 3. Injecte automatiquement l'admin et le superadmin si la BDD est neuve
        logger.info("Exécution du seed des administrateurs...")
        seed_admin_users()
        
        # 4. Injecte les filières, les années, etc.
        logger.info("Exécution du seed des métadonnées...")
        seed_metadata()
        
        logger.info("Initialisation terminée avec succès ! Le serveur est prêt.")
        
    except Exception as e:
        logger.error(f"Erreur critique lors du lifespan au démarrage : {str(e)}")
        # On ne bloque pas le démarrage du conteneur pour éviter le statut "Stopping Container" de Railway
        # Cela permettra au moins au health_check de répondre et de voir l'erreur dans les logs.
    
    yield
    logger.info("Arrêt du backend DIT Archive...")

app = FastAPI(
    title="DIT Archive API", 
    description="API de gestion et d'archivage des projets du Dakar Institute of Technology",
    version="1.0.0",
    lifespan=lifespan
)

# Configuration CORS - Vannes ouvertes pour Vercel et le local
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Route de Health Check essentielle pour ton front Vercel et pour Railway
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

# Gestion du port pour le déploiement Railway
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    # On force reload=False en production pour économiser les ressources sur Railway
    is_dev = os.getenv("RAILWAY_ENVIRONMENT") is None
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=is_dev)