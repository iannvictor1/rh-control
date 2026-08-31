from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import joinedload, Session

from app.auth import exigir_perfis, obter_usuario_atual
from app.dependencies import get_db
from app.models import Colaborador, Ferias
from app.routes.ocorrencias_utils import (
    aplicar_campos_ocorrencia,
    marcar_ocorrencia_removida,
    obter_ocorrencia_ou_404,
    validar_colaborador,
)
from app.schemas import FeriasCreate, FeriasPaginadasResponse, FeriasResponse, FeriasUpdate

router = APIRouter(
    prefix="/ferias",
    tags=["Férias"],
    dependencies=[Depends(obter_usuario_atual)],
)


def obter_ferias_ou_404(ferias_id: int, db: Session):
    return obter_ocorrencia_ou_404(
        Ferias,
        ferias_id,
        db,
        "Férias não encontradas",
    )


def validar_periodo_registro(registro: Ferias):
    if registro.data_fim < registro.data_inicio:
        raise HTTPException(
            status_code=400,
            detail="Data final deve ser maior ou igual à data inicial",
        )

    if registro.data_retorno <= registro.data_fim:
        raise HTTPException(
            status_code=400,
            detail="Data de retorno deve ser posterior à data final",
        )


@router.post("/", response_model=FeriasResponse)
def criar_ferias(
    ferias: FeriasCreate,
    usuario=Depends(exigir_perfis("admin", "rh")),
    db: Session = Depends(get_db),
):
    validar_colaborador(ferias.colaborador_id, db)

    novo_registro = Ferias(
        **ferias.model_dump(),
        criado_por_id=usuario.id,
        atualizado_por_id=usuario.id,
    )

    db.add(novo_registro)
    db.commit()
    db.refresh(novo_registro)

    return novo_registro


@router.get("/", response_model=list[FeriasResponse])
def listar_ferias(db: Session = Depends(get_db)):
    return (
        db.query(Ferias)
        .options(joinedload(Ferias.colaborador))
        .filter(Ferias.removido_em.is_(None))
        .order_by(Ferias.data_inicio.desc(), Ferias.id.desc())
        .all()
    )


@router.get("/busca", response_model=FeriasPaginadasResponse)
def buscar_ferias(
    q: str | None = None,
    data_inicio: date | None = None,
    data_fim: date | None = None,
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
):
    skip = max(skip, 0)
    limit = min(max(limit, 1), 100)

    query = (
        db.query(Ferias)
        .options(joinedload(Ferias.colaborador))
        .join(Colaborador, Colaborador.id == Ferias.colaborador_id)
        .filter(Ferias.removido_em.is_(None))
    )

    if q:
        termo = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Ferias.observacoes.ilike(termo),
                Colaborador.nome.ilike(termo),
            )
        )

    if data_inicio:
        query = query.filter(Ferias.data_inicio >= data_inicio)

    if data_fim:
        query = query.filter(Ferias.data_inicio <= data_fim)

    total = query.count()
    items = (
        query
        .order_by(Ferias.data_inicio.desc(), Ferias.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return {
        "items": items,
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.put("/{ferias_id}", response_model=FeriasResponse)
def atualizar_ferias(
    ferias_id: int,
    dados: FeriasUpdate,
    usuario=Depends(exigir_perfis("admin", "rh")),
    db: Session = Depends(get_db),
):
    registro = obter_ferias_ou_404(ferias_id, db)
    campos = aplicar_campos_ocorrencia(registro, dados)

    if "colaborador_id" in campos:
        validar_colaborador(campos["colaborador_id"], db)

    validar_periodo_registro(registro)
    registro.atualizado_por_id = usuario.id

    db.commit()
    db.refresh(registro)

    return registro


@router.delete("/{ferias_id}", status_code=204)
def excluir_ferias(
    ferias_id: int,
    usuario=Depends(exigir_perfis("admin", "rh")),
    db: Session = Depends(get_db),
):
    registro = obter_ferias_ou_404(ferias_id, db)
    marcar_ocorrencia_removida(registro, usuario.id)
    db.commit()
