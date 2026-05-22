from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.auth import exigir_perfis, obter_usuario_atual

from app.dependencies import get_db
from app.models import Colaborador, Falta
from app.schemas import FaltaCreate, FaltaResponse, FaltaUpdate

router = APIRouter(
    prefix="/faltas",
    tags=["Faltas"],
    dependencies=[Depends(obter_usuario_atual)]
)


def obter_falta_ou_404(falta_id: int, db: Session):
    falta = db.query(Falta).filter(Falta.id == falta_id).first()

    if not falta:
        raise HTTPException(
            status_code=404,
            detail="Falta não encontrada"
        )

    return falta


def validar_colaborador(colaborador_id: int, db: Session):
    colaborador = db.query(Colaborador).filter(
        Colaborador.id == colaborador_id
    ).first()

    if not colaborador:
        raise HTTPException(
            status_code=404,
            detail="Colaborador não encontrado"
        )


@router.post("/", response_model=FaltaResponse)
def criar_falta(
    falta: FaltaCreate,
    _usuario=Depends(exigir_perfis("admin", "rh")),
    db: Session = Depends(get_db)
):
    validar_colaborador(falta.colaborador_id, db)

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


@router.put("/{falta_id}", response_model=FaltaResponse)
def atualizar_falta(
    falta_id: int,
    dados: FaltaUpdate,
    _usuario=Depends(exigir_perfis("admin", "rh")),
    db: Session = Depends(get_db)
):
    falta = obter_falta_ou_404(falta_id, db)
    campos = dados.model_dump(exclude_unset=True)

    if "colaborador_id" in campos:
        validar_colaborador(campos["colaborador_id"], db)

    for campo, valor in campos.items():
        setattr(falta, campo, valor)

    db.commit()
    db.refresh(falta)

    return falta


@router.delete("/{falta_id}", status_code=204)
def excluir_falta(
    falta_id: int,
    _usuario=Depends(exigir_perfis("admin", "rh")),
    db: Session = Depends(get_db)
):
    falta = obter_falta_ou_404(falta_id, db)

    db.delete(falta)
    db.commit()
