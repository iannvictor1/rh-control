from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from app.database import engine
from app.models import Base
from app.routes import faltas
from app.routes import advertencias
from app.routes import suspensoes
from app.routes import atestados
from app.routes import dashboard
from app.routes import auth

from app.routes.colaboradores import (
    router as colaboradores_router
)

Base.metadata.create_all(bind=engine)


def ensure_schema_updates():
    inspector = inspect(engine)
    colunas = [
        coluna["name"]
        for coluna in inspector.get_columns("colaboradores")
    ]

    if "data_aso" not in colunas:
        with engine.begin() as connection:
            connection.execute(
                text("ALTER TABLE colaboradores ADD COLUMN data_aso DATE")
            )


ensure_schema_updates()

app = FastAPI(title="RH Control API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
