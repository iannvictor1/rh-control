from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import obter_usuario_atual
from app.dependencies import get_db
from app.models import NotaAdesiva, Usuario
from app.schemas import (
    NotaAdesivaCreate,
    NotaAdesivaResponse,
    NotaAdesivaUpdate,
)

router = APIRouter(
    prefix="/notas",
    tags=["Notas"],
    dependencies=[Depends(obter_usuario_atual)],
)


def buscar_nota_usuario(
    nota_id: int,
    usuario: Usuario,
    db: Session,
):
    nota = (
        db.query(NotaAdesiva)
        .filter(
            NotaAdesiva.id == nota_id,
            NotaAdesiva.usuario_id == usuario.id,
        )
        .first()
    )

    if not nota:
        raise HTTPException(status_code=404, detail="Nota não encontrada")

    return nota


@router.get("/", response_model=list[NotaAdesivaResponse])
def listar_notas(
    usuario: Usuario = Depends(obter_usuario_atual),
    db: Session = Depends(get_db),
):
    return (
        db.query(NotaAdesiva)
        .filter(NotaAdesiva.usuario_id == usuario.id)
        .order_by(NotaAdesiva.fixada.desc(), NotaAdesiva.atualizado_em.desc())
        .all()
    )


@router.post("/", response_model=NotaAdesivaResponse)
def criar_nota(
    dados: NotaAdesivaCreate,
    usuario: Usuario = Depends(obter_usuario_atual),
    db: Session = Depends(get_db),
):
    nota = NotaAdesiva(
        **dados.model_dump(),
        usuario_id=usuario.id,
    )

    db.add(nota)
    db.commit()
    db.refresh(nota)

    return nota


@router.put("/{nota_id}", response_model=NotaAdesivaResponse)
def atualizar_nota(
    nota_id: int,
    dados: NotaAdesivaUpdate,
    usuario: Usuario = Depends(obter_usuario_atual),
    db: Session = Depends(get_db),
):
    nota = buscar_nota_usuario(nota_id, usuario, db)

    for campo, valor in dados.model_dump(exclude_unset=True).items():
        setattr(nota, campo, valor)

    db.commit()
    db.refresh(nota)

    return nota


@router.delete("/{nota_id}")
def excluir_nota(
    nota_id: int,
    usuario: Usuario = Depends(obter_usuario_atual),
    db: Session = Depends(get_db),
):
    nota = buscar_nota_usuario(nota_id, usuario, db)

    db.delete(nota)
    db.commit()

    return {"ok": True}
