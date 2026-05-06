from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Colaborador
from app.schemas import ColaboradorCreate, ColaboradorResponse

router = APIRouter(
    prefix="/colaboradores",
    tags=["Colaboradores"]
)


def get_db():
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


@router.post("/", response_model=ColaboradorResponse)
def criar_colaborador(
    colaborador: ColaboradorCreate,
    db: Session = Depends(get_db)
):
    novo_colaborador = Colaborador(
        **colaborador.model_dump()
    )

    db.add(novo_colaborador)

    db.commit()

    db.refresh(novo_colaborador)

    return novo_colaborador


@router.get("/", response_model=list[ColaboradorResponse])
def listar_colaboradores(
    db: Session = Depends(get_db)
):
    return db.query(Colaborador).all()