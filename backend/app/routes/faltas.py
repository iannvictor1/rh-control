from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import or_
from sqlalchemy.orm import joinedload
from sqlalchemy.orm import Session

from app.auth import exigir_perfis, obter_usuario_atual
from app.dependencies import get_db
from app.models import Colaborador, Falta
from app.routes.ocorrencias_utils import (
    aplicar_campos_ocorrencia,
    marcar_ocorrencia_removida,
    obter_ocorrencia_ou_404,
    validar_colaborador,
)
from app.schemas import FaltaCreate, FaltaResponse, FaltasPaginadasResponse, FaltaUpdate

router = APIRouter(
    prefix="/faltas",
    tags=["Faltas"],
    dependencies=[Depends(obter_usuario_atual)],
)


def obter_falta_ou_404(falta_id: int, db: Session):
    return obter_ocorrencia_ou_404(
        Falta,
        falta_id,
        db,
        "Falta não encontrada",
    )


@router.post("/", response_model=FaltaResponse)
def criar_falta(
    falta: FaltaCreate,
    usuario=Depends(exigir_perfis("admin", "rh")),
    db: Session = Depends(get_db),
):
    validar_colaborador(falta.colaborador_id, db)

    nova_falta = Falta(
        **falta.model_dump(),
        criado_por_id=usuario.id,
        atualizado_por_id=usuario.id,
    )

    db.add(nova_falta)
    db.commit()
    db.refresh(nova_falta)

    return nova_falta


@router.get("/", response_model=list[FaltaResponse])
def listar_faltas(db: Session = Depends(get_db)):
    return (
        db.query(Falta)
        .options(joinedload(Falta.colaborador))
        .filter(Falta.removido_em.is_(None))
        .all()
    )


@router.get("/busca", response_model=FaltasPaginadasResponse)
def buscar_faltas(
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
        db.query(Falta)
        .options(joinedload(Falta.colaborador))
        .join(Colaborador, Colaborador.id == Falta.colaborador_id)
        .filter(Falta.removido_em.is_(None))
    )

    if q:
        termo = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Falta.motivo.ilike(termo),
                Colaborador.nome.ilike(termo),
            )
        )

    if data_inicio:
        query = query.filter(Falta.data_falta >= data_inicio)

    if data_fim:
        query = query.filter(Falta.data_falta <= data_fim)

    total = query.count()
    items = (
        query
        .order_by(Falta.data_falta.desc(), Falta.id.desc())
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


@router.put("/{falta_id}", response_model=FaltaResponse)
def atualizar_falta(
    falta_id: int,
    dados: FaltaUpdate,
    usuario=Depends(exigir_perfis("admin", "rh")),
    db: Session = Depends(get_db),
):
    falta = obter_falta_ou_404(falta_id, db)
    campos = aplicar_campos_ocorrencia(falta, dados)

    if "colaborador_id" in campos:
        validar_colaborador(campos["colaborador_id"], db)

    falta.atualizado_por_id = usuario.id

    db.commit()
    db.refresh(falta)

    return falta


@router.delete("/{falta_id}", status_code=204)
def excluir_falta(
    falta_id: int,
    usuario=Depends(exigir_perfis("admin", "rh")),
    db: Session = Depends(get_db),
):
    falta = obter_falta_ou_404(falta_id, db)
    marcar_ocorrencia_removida(falta, usuario.id)
    db.commit()
