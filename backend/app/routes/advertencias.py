from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.auth import obter_usuario_atual
from app.dependencies import get_db

from app.models import Advertencia
from app.schemas import (
    AdvertenciaCreate,
    AdvertenciaResponse
)

router = APIRouter(
    prefix="/advertencias",
    tags=["Advertências"],
    dependencies=[Depends(obter_usuario_atual)]
)

@router.post("/", response_model=AdvertenciaResponse)
def criar_advertencia(
    advertencia: AdvertenciaCreate,
    db: Session = Depends(get_db)
):
    nova_advertencia = Advertencia(
        **advertencia.model_dump()
    )

    db.add(nova_advertencia)

    db.commit()

    db.refresh(nova_advertencia)

    return nova_advertencia


@router.get("/", response_model=list[AdvertenciaResponse])
def listar_advertencias(
    db: Session = Depends(get_db)
):
    return db.query(Advertencia).all()