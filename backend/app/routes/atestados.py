from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import exigir_perfis, obter_usuario_atual
from app.dependencies import get_db
from app.models import AtestadoMedico, Colaborador
from app.schemas import (
    AtestadoMedicoCreate,
    AtestadoMedicoResponse,
    AtestadoMedicoUpdate,
)

router = APIRouter(
    prefix="/atestados",
    tags=["Atestados médicos"],
    dependencies=[Depends(obter_usuario_atual)],
)


def obter_atestado_ou_404(atestado_id: int, db: Session):
    atestado = db.query(AtestadoMedico).filter(
        AtestadoMedico.id == atestado_id
    ).first()

    if not atestado:
        raise HTTPException(
            status_code=404,
            detail="Atestado médico não encontrado"
        )

    return atestado


def validar_colaborador(colaborador_id: int, db: Session):
    colaborador = db.query(Colaborador).filter(
        Colaborador.id == colaborador_id
    ).first()

    if not colaborador:
        raise HTTPException(
            status_code=404,
            detail="Colaborador não encontrado"
        )


@router.post("/", response_model=AtestadoMedicoResponse)
def criar_atestado(
    atestado: AtestadoMedicoCreate,
    _usuario=Depends(exigir_perfis("admin", "rh")),
    db: Session = Depends(get_db),
):
    validar_colaborador(atestado.colaborador_id, db)

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


@router.put("/{atestado_id}", response_model=AtestadoMedicoResponse)
def atualizar_atestado(
    atestado_id: int,
    dados: AtestadoMedicoUpdate,
    _usuario=Depends(exigir_perfis("admin", "rh")),
    db: Session = Depends(get_db),
):
    atestado = obter_atestado_ou_404(atestado_id, db)
    campos = dados.model_dump(exclude_unset=True)

    if "colaborador_id" in campos:
        validar_colaborador(campos["colaborador_id"], db)

    for campo, valor in campos.items():
        setattr(atestado, campo, valor)

    db.commit()
    db.refresh(atestado)

    return atestado


@router.delete("/{atestado_id}", status_code=204)
def excluir_atestado(
    atestado_id: int,
    _usuario=Depends(exigir_perfis("admin", "rh")),
    db: Session = Depends(get_db),
):
    atestado = obter_atestado_ou_404(atestado_id, db)

    db.delete(atestado)
    db.commit()
