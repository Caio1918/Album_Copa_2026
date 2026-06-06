from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import dashboard, faltantes, figurinhas, figurinhas_coladas, grupos, health, jogadores, repetidas, selecoes

app = FastAPI(title="Album Copa 2026 API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(grupos.router, prefix="/grupos", tags=["Grupos"])
app.include_router(selecoes.router, prefix="/selecoes", tags=["Seleções"])
app.include_router(jogadores.router, prefix="/jogadores", tags=["Jogadores"])
app.include_router(figurinhas.router, prefix="/figurinhas", tags=["Figurinhas"])
app.include_router(figurinhas_coladas.router, prefix="/figurinhas-coladas", tags=["Figurinhas coladas"])
app.include_router(repetidas.router, prefix="/repetidas", tags=["Figurinhas repetidas"])
app.include_router(faltantes.router, prefix="/faltantes", tags=["Figurinhas faltantes"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
