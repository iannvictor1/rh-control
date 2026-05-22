from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.auth import exigir_perfis, obter_usuario_atual
from app.dependencies import get_db

from app.models import Advertencia, Colaborador
from app.schemas import (
    AdvertenciaCreate,
    AdvertenciaResponse,
    AdvertenciaUpdate,
)

router = APIRouter(
    prefix="/advertencias",
    tags=["Advertências"],
    dependencies=[Depends(obter_usuario_atual)]
)


def obter_advertencia_ou_404(advertencia_id: int, db: Session):
    advertencia = db.query(Advertencia).filter(
        Advertencia.id == advertencia_id
    ).first()

    if not advertencia:
        raise HTTPException(
            status_code=404,
            detail="Advertência não encontrada"
        )

    return advertencia


def validar_colaborador(colaborador_id: int, db: Session):
    colaborador = db.query(Colaborador).filter(
        Colaborador.id == colaborador_id
    ).first()

    if not colaborador:
        raise HTTPException(
            status_code=404,
            detail="Colaborador não encontrado"
        )


@router.post("/", response_model=AdvertenciaResponse)
def criar_advertencia(
    advertencia: AdvertenciaCreate,
    _usuario=Depends(exigir_perfis("admin", "rh")),
    db: Session = Depends(get_db)
):
    validar_colaborador(advertencia.colaborador_id, db)

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


@router.put("/{advertencia_id}", response_model=AdvertenciaResponse)
def atualizar_advertencia(
    advertencia_id: int,
    dados: AdvertenciaUpdate,
    _usuario=Depends(exigir_perfis("admin", "rh")),
    db: Session = Depends(get_db)
):
    advertencia = obter_advertencia_ou_404(advertencia_id, db)
    campos = dados.model_dump(exclude_unset=True)

    if "colaborador_id" in campos:
        validar_colaborador(campos["colaborador_id"], db)

    for campo, valor in campos.items():
        setattr(advertencia, campo, valor)

    db.commit()
    db.refresh(advertencia)

    return advertencia


@router.delete("/{advertencia_id}", status_code=204)
def excluir_advertencia(
    advertencia_id: int,
    _usuario=Depends(exigir_perfis("admin", "rh")),
    db: Session = Depends(get_db)
):
    advertencia = obter_advertencia_ou_404(advertencia_id, db)

    db.delete(advertencia)
    db.commit()
