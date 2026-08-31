from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import or_
from sqlalchemy.orm import joinedload
from sqlalchemy.orm import Session

from app.auth import exigir_perfis, obter_usuario_atual
from app.dependencies import get_db
from app.models import Colaborador, Suspensao
from app.routes.ocorrencias_utils import (
    aplicar_campos_ocorrencia,
    marcar_ocorrencia_removida,
    obter_ocorrencia_ou_404,
    validar_colaborador,
)
from app.schemas import (
    SuspensaoCreate,
    SuspensaoResponse,
    SuspensoesPaginadasResponse,
    SuspensaoUpdate,
)

router = APIRouter(
    prefix="/suspensoes",
    tags=["Suspensões"],
    dependencies=[Depends(obter_usuario_atual)],
)


def obter_suspensao_ou_404(suspensao_id: int, db: Session):
    return obter_ocorrencia_ou_404(
        Suspensao,
        suspensao_id,
        db,
        "Suspensão não encontrada",
    )


@router.post("/", response_model=SuspensaoResponse)
def criar_suspensao(
    suspensao: SuspensaoCreate,
    usuario=Depends(exigir_perfis("admin", "rh")),
    db: Session = Depends(get_db),
):
    validar_colaborador(suspensao.colaborador_id, db)

    nova_suspensao = Suspensao(
        **suspensao.model_dump(),
        criado_por_id=usuario.id,
        atualizado_por_id=usuario.id,
    )

    db.add(nova_suspensao)
    db.commit()
    db.refresh(nova_suspensao)

    return nova_suspensao


@router.get("/", response_model=list[SuspensaoResponse])
def listar_suspensoes(db: Session = Depends(get_db)):
    return (
        db.query(Suspensao)
        .options(joinedload(Suspensao.colaborador))
        .filter(Suspensao.removido_em.is_(None))
        .all()
    )


@router.get("/busca", response_model=SuspensoesPaginadasResponse)
def buscar_suspensoes(
    q: str | None = None,
    status: str = "todos",
    data_inicio: date | None = None,
    data_fim: date | None = None,
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
):
    skip = max(skip, 0)
    limit = min(max(limit, 1), 100)

    query = (
        db.query(Suspensao)
        .options(joinedload(Suspensao.colaborador))
        .join(Colaborador, Colaborador.id == Suspensao.colaborador_id)
        .filter(Suspensao.removido_em.is_(None))
    )

    if q:
        termo = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Suspensao.motivo.ilike(termo),
                Suspensao.status.ilike(termo),
                Colaborador.nome.ilike(termo),
            )
        )

    if status != "todos":
        query = query.filter(Suspensao.status == status)

    if data_inicio:
        query = query.filter(Suspensao.data_inicio >= data_inicio)

    if data_fim:
        query = query.filter(Suspensao.data_inicio <= data_fim)

    total = query.count()
    items = (
        query
        .order_by(Suspensao.data_inicio.desc(), Suspensao.id.desc())
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


@router.put("/{suspensao_id}", response_model=SuspensaoResponse)
def atualizar_suspensao(
    suspensao_id: int,
    dados: SuspensaoUpdate,
    usuario=Depends(exigir_perfis("admin", "rh")),
    db: Session = Depends(get_db),
):
    suspensao = obter_suspensao_ou_404(suspensao_id, db)
    campos = aplicar_campos_ocorrencia(suspensao, dados)

    if "colaborador_id" in campos:
        validar_colaborador(campos["colaborador_id"], db)

    suspensao.atualizado_por_id = usuario.id

    db.commit()
    db.refresh(suspensao)

    return suspensao


@router.delete("/{suspensao_id}", status_code=204)
def excluir_suspensao(
    suspensao_id: int,
    usuario=Depends(exigir_perfis("admin", "rh")),
    db: Session = Depends(get_db),
):
    suspensao = obter_suspensao_ou_404(suspensao_id, db)
    marcar_ocorrencia_removida(suspensao, usuario.id)
    db.commit()
