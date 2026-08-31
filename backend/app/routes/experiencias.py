from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth import exigir_perfis, obter_usuario_atual
from app.dependencies import get_db
from app.models import Colaborador, ExperienciaConcluida
from app.routes.dashboard import calcular_vencimentos_experiencia
from app.schemas import ExperienciaConcluidaCreate, ExperienciaConcluidaResponse

router = APIRouter(
    prefix="/experiencias",
    tags=["Experiências"],
    dependencies=[Depends(obter_usuario_atual)],
)


def obter_vencimento_esperado(colaborador: Colaborador, etapa: str):
    if not colaborador.data_admissao:
        return None

    vencimentos = dict(calcular_vencimentos_experiencia(colaborador.data_admissao))
    return vencimentos.get(etapa)


@router.post(
    "/{colaborador_id}/concluir",
    response_model=ExperienciaConcluidaResponse,
)
def concluir_experiencia(
    colaborador_id: int,
    dados: ExperienciaConcluidaCreate,
    usuario=Depends(exigir_perfis("admin", "rh")),
    db: Session = Depends(get_db),
):
    colaborador = db.query(Colaborador).filter(Colaborador.id == colaborador_id).first()

    if not colaborador:
        raise HTTPException(status_code=404, detail="Colaborador não encontrado")

    vencimento_esperado = obter_vencimento_esperado(colaborador, dados.etapa)

    if not vencimento_esperado:
        raise HTTPException(
            status_code=400,
            detail="Colaborador sem data de admissão para calcular experiência",
        )

    if dados.vencimento_experiencia != vencimento_esperado:
        raise HTTPException(
            status_code=400,
            detail="Vencimento da experiência não corresponde à data de admissão",
        )

    experiencia = (
        db.query(ExperienciaConcluida)
        .filter(
            ExperienciaConcluida.colaborador_id == colaborador_id,
            ExperienciaConcluida.etapa == dados.etapa,
            ExperienciaConcluida.vencimento_experiencia == dados.vencimento_experiencia,
        )
        .first()
    )

    if experiencia:
        return experiencia

    experiencia = ExperienciaConcluida(
        colaborador_id=colaborador_id,
        etapa=dados.etapa,
        vencimento_experiencia=dados.vencimento_experiencia,
        concluido_em=datetime.now(UTC),
        concluido_por_id=usuario.id,
    )

    db.add(experiencia)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        experiencia = (
            db.query(ExperienciaConcluida)
            .filter(
                ExperienciaConcluida.colaborador_id == colaborador_id,
                ExperienciaConcluida.etapa == dados.etapa,
                ExperienciaConcluida.vencimento_experiencia
                == dados.vencimento_experiencia,
            )
            .first()
        )

        if experiencia:
            return experiencia

        raise

    db.refresh(experiencia)
    return experiencia
