from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import or_
from sqlalchemy.orm import joinedload
from sqlalchemy.orm import Session

from app.auth import exigir_perfis, obter_usuario_atual
from app.dependencies import get_db
from app.models import Colaborador, FichaFeedback
from app.routes.ocorrencias_utils import (
    aplicar_campos_ocorrencia,
    marcar_ocorrencia_removida,
    obter_ocorrencia_ou_404,
    validar_colaborador,
)
from app.schemas import (
    FichaFeedbackCreate,
    FichaFeedbackResponse,
    FichasFeedbackPaginadasResponse,
    FichaFeedbackUpdate,
)

router = APIRouter(
    prefix="/fichas-feedback",
    tags=["Fichas de Feedback"],
    dependencies=[Depends(obter_usuario_atual)],
)


def obter_ficha_ou_404(ficha_id: int, db: Session):
    return obter_ocorrencia_ou_404(
        FichaFeedback,
        ficha_id,
        db,
        "Ficha de feedback não encontrada",
    )


@router.post("/", response_model=FichaFeedbackResponse)
def criar_ficha_feedback(
    ficha: FichaFeedbackCreate,
    usuario=Depends(exigir_perfis("admin", "rh")),
    db: Session = Depends(get_db),
):
    validar_colaborador(ficha.colaborador_id, db)

    nova_ficha = FichaFeedback(
        **ficha.model_dump(),
        criado_por_id=usuario.id,
        atualizado_por_id=usuario.id,
    )

    db.add(nova_ficha)
    db.commit()
    db.refresh(nova_ficha)

    return nova_ficha


@router.get("/", response_model=list[FichaFeedbackResponse])
def listar_fichas_feedback(db: Session = Depends(get_db)):
    return (
        db.query(FichaFeedback)
        .options(joinedload(FichaFeedback.colaborador))
        .filter(FichaFeedback.removido_em.is_(None))
        .all()
    )


@router.get("/busca", response_model=FichasFeedbackPaginadasResponse)
def buscar_fichas_feedback(
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
        db.query(FichaFeedback)
        .options(joinedload(FichaFeedback.colaborador))
        .join(Colaborador, Colaborador.id == FichaFeedback.colaborador_id)
        .filter(FichaFeedback.removido_em.is_(None))
    )

    if q:
        termo = f"%{q.strip()}%"
        query = query.filter(
            or_(
                FichaFeedback.ocorrencia.ilike(termo),
                FichaFeedback.motivo.ilike(termo),
                FichaFeedback.observacoes.ilike(termo),
                Colaborador.nome.ilike(termo),
            )
        )

    if data_inicio:
        query = query.filter(FichaFeedback.data_ocorrencia >= data_inicio)

    if data_fim:
        query = query.filter(FichaFeedback.data_ocorrencia <= data_fim)

    total = query.count()
    items = (
        query
        .order_by(FichaFeedback.data_ocorrencia.desc(), FichaFeedback.id.desc())
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


@router.put("/{ficha_id}", response_model=FichaFeedbackResponse)
def atualizar_ficha_feedback(
    ficha_id: int,
    dados: FichaFeedbackUpdate,
    usuario=Depends(exigir_perfis("admin", "rh")),
    db: Session = Depends(get_db),
):
    ficha = obter_ficha_ou_404(ficha_id, db)
    campos = aplicar_campos_ocorrencia(ficha, dados)

    if "colaborador_id" in campos:
        validar_colaborador(campos["colaborador_id"], db)

    ficha.atualizado_por_id = usuario.id

    db.commit()
    db.refresh(ficha)

    return ficha


@router.delete("/{ficha_id}", status_code=204)
def excluir_ficha_feedback(
    ficha_id: int,
    usuario=Depends(exigir_perfis("admin", "rh")),
    db: Session = Depends(get_db),
):
    ficha = obter_ficha_ou_404(ficha_id, db)
    marcar_ocorrencia_removida(ficha, usuario.id)
    db.commit()
