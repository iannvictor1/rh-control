from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.auth import obter_usuario_atual

from app.dependencies import get_db
from app.models import Falta
from app.schemas import FaltaCreate, FaltaResponse

router = APIRouter(
    prefix="/faltas",
    tags=["Faltas"],
    dependencies=[Depends(obter_usuario_atual)]
)

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