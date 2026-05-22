from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import exigir_perfis, obter_usuario_atual
from app.dependencies import get_db
from app.models import Colaborador, Suspensao
from app.schemas import (
    SuspensaoCreate,
    SuspensaoResponse,
    SuspensaoUpdate,
)

router = APIRouter(
    prefix="/suspensoes",
    tags=["Suspensões"],
    dependencies=[Depends(obter_usuario_atual)],
)


def obter_suspensao_ou_404(suspensao_id: int, db: Session):
    suspensao = db.query(Suspensao).filter(
        Suspensao.id == suspensao_id
    ).first()

    if not suspensao:
        raise HTTPException(
            status_code=404,
            detail="Suspensão não encontrada"
        )

    return suspensao


def validar_colaborador(colaborador_id: int, db: Session):
    colaborador = db.query(Colaborador).filter(
        Colaborador.id == colaborador_id
    ).first()

    if not colaborador:
        raise HTTPException(
            status_code=404,
            detail="Colaborador não encontrado"
        )


@router.post("/", response_model=SuspensaoResponse)
def criar_suspensao(
    suspensao: SuspensaoCreate,
    _usuario=Depends(exigir_perfis("admin", "rh")),
    db: Session = Depends(get_db),
):
    validar_colaborador(suspensao.colaborador_id, db)

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


@router.put("/{suspensao_id}", response_model=SuspensaoResponse)
def atualizar_suspensao(
    suspensao_id: int,
    dados: SuspensaoUpdate,
    _usuario=Depends(exigir_perfis("admin", "rh")),
    db: Session = Depends(get_db),
):
    suspensao = obter_suspensao_ou_404(suspensao_id, db)
    campos = dados.model_dump(exclude_unset=True)

    if "colaborador_id" in campos:
        validar_colaborador(campos["colaborador_id"], db)

    for campo, valor in campos.items():
        setattr(suspensao, campo, valor)

    db.commit()
    db.refresh(suspensao)

    return suspensao


@router.delete("/{suspensao_id}", status_code=204)
def excluir_suspensao(
    suspensao_id: int,
    _usuario=Depends(exigir_perfis("admin", "rh")),
    db: Session = Depends(get_db),
):
    suspensao = obter_suspensao_ou_404(suspensao_id, db)

    db.delete(suspensao)
    db.commit()
