from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import or_
from sqlalchemy.orm import joinedload
from sqlalchemy.orm import Session

from app.auth import exigir_perfis, obter_usuario_atual
from app.dependencies import get_db
from app.models import Advertencia, Colaborador
from app.routes.ocorrencias_utils import (
    aplicar_campos_ocorrencia,
    marcar_ocorrencia_removida,
    obter_ocorrencia_ou_404,
    validar_colaborador,
)
from app.schemas import (
    AdvertenciaCreate,
    AdvertenciasPaginadasResponse,
    AdvertenciaResponse,
    AdvertenciaUpdate,
)

router = APIRouter(
    prefix="/advertencias",
    tags=["Advertências"],
    dependencies=[Depends(obter_usuario_atual)],
)


def obter_advertencia_ou_404(advertencia_id: int, db: Session):
    return obter_ocorrencia_ou_404(
        Advertencia,
        advertencia_id,
        db,
        "Advertência não encontrada",
    )


@router.post("/", response_model=AdvertenciaResponse)
def criar_advertencia(
    advertencia: AdvertenciaCreate,
    usuario=Depends(exigir_perfis("admin", "rh")),
    db: Session = Depends(get_db),
):
    validar_colaborador(advertencia.colaborador_id, db)

    nova_advertencia = Advertencia(
        **advertencia.model_dump(),
        criado_por_id=usuario.id,
        atualizado_por_id=usuario.id,
    )

    db.add(nova_advertencia)
    db.commit()
    db.refresh(nova_advertencia)

    return nova_advertencia


@router.get("/", response_model=list[AdvertenciaResponse])
def listar_advertencias(db: Session = Depends(get_db)):
    return (
        db.query(Advertencia)
        .options(joinedload(Advertencia.colaborador))
        .filter(Advertencia.removido_em.is_(None))
        .all()
    )


@router.get("/busca", response_model=AdvertenciasPaginadasResponse)
def buscar_advertencias(
    q: str | None = None,
    tipo: str = "todos",
    data_inicio: date | None = None,
    data_fim: date | None = None,
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
):
    skip = max(skip, 0)
    limit = min(max(limit, 1), 100)

    query = (
        db.query(Advertencia)
        .options(joinedload(Advertencia.colaborador))
        .join(Colaborador, Colaborador.id == Advertencia.colaborador_id)
        .filter(Advertencia.removido_em.is_(None))
    )

    if q:
        termo = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Advertencia.motivo.ilike(termo),
                Advertencia.tipo.ilike(termo),
                Colaborador.nome.ilike(termo),
            )
        )

    if tipo != "todos":
        query = query.filter(Advertencia.tipo == tipo)

    if data_inicio:
        query = query.filter(Advertencia.data_advertencia >= data_inicio)

    if data_fim:
        query = query.filter(Advertencia.data_advertencia <= data_fim)

    total = query.count()
    items = (
        query
        .order_by(Advertencia.data_advertencia.desc(), Advertencia.id.desc())
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


@router.put("/{advertencia_id}", response_model=AdvertenciaResponse)
def atualizar_advertencia(
    advertencia_id: int,
    dados: AdvertenciaUpdate,
    usuario=Depends(exigir_perfis("admin", "rh")),
    db: Session = Depends(get_db),
):
    advertencia = obter_advertencia_ou_404(advertencia_id, db)
    campos = aplicar_campos_ocorrencia(advertencia, dados)

    if "colaborador_id" in campos:
        validar_colaborador(campos["colaborador_id"], db)

    advertencia.atualizado_por_id = usuario.id

    db.commit()
    db.refresh(advertencia)

    return advertencia


@router.delete("/{advertencia_id}", status_code=204)
def excluir_advertencia(
    advertencia_id: int,
    usuario=Depends(exigir_perfis("admin", "rh")),
    db: Session = Depends(get_db),
):
    advertencia = obter_advertencia_ou_404(advertencia_id, db)
    marcar_ocorrencia_removida(advertencia, usuario.id)
    db.commit()
