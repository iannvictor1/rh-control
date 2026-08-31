from datetime import UTC, datetime

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import Colaborador


def validar_colaborador(colaborador_id: int, db: Session):
    colaborador = db.query(Colaborador).filter(
        Colaborador.id == colaborador_id
    ).first()

    if not colaborador:
        raise HTTPException(
            status_code=404,
            detail="Colaborador não encontrado",
        )


def obter_ocorrencia_ou_404(modelo, ocorrencia_id: int, db: Session, mensagem: str):
    ocorrencia = db.query(modelo).filter(
        modelo.id == ocorrencia_id,
        modelo.removido_em.is_(None),
    ).first()

    if not ocorrencia:
        raise HTTPException(
            status_code=404,
            detail=mensagem,
        )

    return ocorrencia


def aplicar_campos_ocorrencia(ocorrencia, dados):
    campos = dados.model_dump(exclude_unset=True)

    for campo, valor in campos.items():
        setattr(ocorrencia, campo, valor)

    return campos


def marcar_ocorrencia_removida(ocorrencia, usuario_id: int):
    ocorrencia.removido_em = datetime.now(UTC)
    ocorrencia.removido_por_id = usuario_id
    ocorrencia.atualizado_por_id = usuario_id
