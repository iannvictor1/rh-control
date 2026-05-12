from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth import obter_usuario_atual
from app.dependencies import get_db
from app.models import Suspensao
from app.schemas import (
    SuspensaoCreate,
    SuspensaoResponse,
)

router = APIRouter(
    prefix="/suspensoes",
    tags=["Suspensões"],
    dependencies=[Depends(obter_usuario_atual)],
)


@router.post("/", response_model=SuspensaoResponse)
def criar_suspensao(
    suspensao: SuspensaoCreate,
    db: Session = Depends(get_db),
):
    nova_suspensao = Suspensao(
        **suspensao.model_dump()
    )

    db.add(nova_suspensao)
    db.commit()
    db.refresh(nova_suspensao)

    return nova_suspensao


@router.get("/", response_model=list[SuspensaoResponse])
def listar_suspensoes(
    db: Session = Depends(get_db),
):
    return db.query(Suspensao).all()
