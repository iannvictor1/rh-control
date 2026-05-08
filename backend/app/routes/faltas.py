from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Falta
from app.schemas import FaltaCreate, FaltaResponse

router = APIRouter(
    prefix="/faltas",
    tags=["Faltas"]
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=FaltaResponse)
def criar_falta(
    falta: FaltaCreate,
    db: Session = Depends(get_db)
):
    nova_falta = Falta(**falta.model_dump())

    db.add(nova_falta)
    db.commit()
    db.refresh(nova_falta)

    return nova_falta


@router.get("/", response_model=list[FaltaResponse])
def listar_faltas(
    db: Session = Depends(get_db)
):
    return db.query(Falta).all()