from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import os

from app.routes import faltas
from app.routes import advertencias
from app.routes import suspensoes
from app.routes import atestados
from app.routes import dashboard
from app.routes import auth
from app.routes import usuarios

from app.routes.colaboradores import (
    router as colaboradores_router
)

app = FastAPI(title="RH Control API")

cors_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok"}


app.include_router(colaboradores_router)
app.include_router(faltas.router)
app.include_router(advertencias.router)
app.include_router(suspensoes.router)
app.include_router(atestados.router)
app.include_router(dashboard.router)
app.include_router(auth.router)
app.include_router(usuarios.router)
