from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import *
from routers import admin, projects, nora, util_endpoints, auth_and_users


Base.metadata.create_all(bind=engine)

app = FastAPI(title="DIT Archive API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(admin.router)
app.include_router(projects.router)
app.include_router(nora.router)
app.include_router(util_endpoints.router)
app.include_router(auth_and_users.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)