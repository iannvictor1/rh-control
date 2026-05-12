from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth import obter_usuario_atual
from app.dependencies import get_db
from app.models import AtestadoMedico
from app.schemas import (
    AtestadoMedicoCreate,
    AtestadoMedicoResponse,
)

router = APIRouter(
    prefix="/atestados",
    tags=["Atestados médicos"],
    dependencies=[Depends(obter_usuario_atual)],
)


@router.post("/", response_model=AtestadoMedicoResponse)
def criar_atestado(
    atestado: AtestadoMedicoCreate,
    db: Session = Depends(get_db),
):
    novo_atestado = AtestadoMedico(
        **atestado.model_dump()
    )

    db.add(novo_atestado)
    db.commit()
    db.refresh(novo_atestado)

    return novo_atestado


@router.get("/", response_model=list[AtestadoMedicoResponse])
def listar_atestados(
    db: Session = Depends(get_db),
):
    return db.query(AtestadoMedico).all()
