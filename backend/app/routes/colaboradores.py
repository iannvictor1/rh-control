from fastapi import APIRouter, Depends, HTTPException
from app.schemas import ColaboradorCreate, ColaboradorResponse, ColaboradorUpdate
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Colaborador
from app.schemas import ColaboradorCreate, ColaboradorResponse
from app.models import (
    Colaborador,
    Falta,
    Advertencia,
    Suspensao
)

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

@router.put("/{colaborador_id}", response_model=ColaboradorResponse)
def atualizar_colaborador(
    colaborador_id: int,
    dados: ColaboradorUpdate,
    db: Session = Depends(get_db)
):
    colaborador = db.query(Colaborador).filter(Colaborador.id == colaborador_id).first()

    if not colaborador:
        raise HTTPException(status_code=404, detail="Colaborador não encontrado")

    for campo, valor in dados.model_dump(exclude_unset=True).items():
        setattr(colaborador, campo, valor)

    db.commit()
    db.refresh(colaborador)

    return colaborador


@router.patch("/{colaborador_id}/inativar", response_model=ColaboradorResponse)
def inativar_colaborador(
    colaborador_id: int,
    db: Session = Depends(get_db)
):
    colaborador = db.query(Colaborador).filter(Colaborador.id == colaborador_id).first()

    if not colaborador:
        raise HTTPException(status_code=404, detail="Colaborador não encontrado")

    colaborador.ativo = False

    db.commit()
    db.refresh(colaborador)

    return colaborador

@router.get("/{colaborador_id}")
def detalhar_colaborador(
    colaborador_id: int,
    db: Session = Depends(get_db)
):
    colaborador = db.query(Colaborador).filter(
        Colaborador.id == colaborador_id
    ).first()

    if not colaborador:
        raise HTTPException(
            status_code=404,
            detail="Colaborador não encontrado"
        )

    faltas = db.query(Falta).filter(
        Falta.colaborador_id == colaborador_id
    ).all()

    advertencias = db.query(Advertencia).filter(
        Advertencia.colaborador_id == colaborador_id
    ).all()

    suspensoes = db.query(Suspensao).filter(
        Suspensao.colaborador_id == colaborador_id
    ).all()

    return {
        "colaborador": colaborador,
        "faltas": faltas,
        "advertencias": advertencias,
        "suspensoes": suspensoes
    }