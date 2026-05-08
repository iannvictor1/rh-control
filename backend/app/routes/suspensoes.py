from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Suspensao
from app.schemas import (
    SuspensaoCreate,
    SuspensaoResponse
)

router = APIRouter(
    prefix="/suspensoes",
    tags=["Suspensões"]
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=SuspensaoResponse)
def criar_suspensao(
    suspensao: SuspensaoCreate,
    db: Session = Depends(get_db)
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
    db: Session = Depends(get_db)
):
    return db.query(Suspensao).all()