import os
from fastapi import FastAPI
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from config.database import engine
from models import sql_models
from routers import admin, projects, nora, util_endpoints, auth_and_users
from listeners import listeners
from seeds.seed_admin_users import seed_admin_users 
from seeds.seed_metadata import seed_metadata
from dotenv import load_dotenv

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Crée les tables si elles n'existent pas en BDD
    sql_models.Base.metadata.create_all(bind=engine)
    
    # 2. Injecte automatiquement l'admin et le superadmin si la BDD est neuve
    seed_admin_users()
    
    # 3. Injeter, les filières, les années et chai plus quoi d'autre
    seed_metadata()
    
    yield

app = FastAPI(title="DIT Archive API", lifespan=lifespan)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusion des routes
app.include_router(admin.router)
app.include_router(projects.router)
app.include_router(nora.router)
app.include_router(util_endpoints.router)
app.include_router(auth_and_users.router)

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)