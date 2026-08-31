from datetime import date
import os
from pathlib import Path
from uuid import uuid4


from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy import or_
from sqlalchemy.orm import joinedload
from sqlalchemy.orm import Session

from app.auth import exigir_perfis, obter_usuario_atual
from app.dependencies import get_db
from app.models import AnexoAtestado, AtestadoMedico, Colaborador
from app.routes.ocorrencias_utils import (
    aplicar_campos_ocorrencia,
    marcar_ocorrencia_removida,
    obter_ocorrencia_ou_404,
    validar_colaborador,
)
from app.schemas import (
    AtestadoMedicoCreate,
    AtestadoMedicoResponse,
    AtestadoMedicoUpdate,
    AnexoAtestadoResponse,
    AtestadosPaginadosResponse,
)

router = APIRouter(
    prefix="/atestados",
    tags=["Atestados médicos"],
    dependencies=[Depends(obter_usuario_atual)],
)

UPLOADS_DIR = Path(
    os.getenv(
        "ATESTADOS_UPLOAD_DIR",
        Path(__file__).resolve().parents[2] / "uploads" / "atestados",
    )
)
TIPOS_PERMITIDOS = {
    "application/pdf": ".pdf",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


def obter_atestado_ou_404(atestado_id: int, db: Session):
    return obter_ocorrencia_ou_404(
        AtestadoMedico,
        atestado_id,
        db,
        "Atestado médico não encontrado",
    )


def obter_anexo_ou_404(anexo_id: int, db: Session):
    anexo = db.query(AnexoAtestado).filter(AnexoAtestado.id == anexo_id).first()

    if not anexo:
        raise HTTPException(status_code=404, detail="Anexo não encontrado")

    return anexo


@router.post("/", response_model=AtestadoMedicoResponse)
def criar_atestado(
    atestado: AtestadoMedicoCreate,
    usuario=Depends(exigir_perfis("admin", "rh")),
    db: Session = Depends(get_db),
):
    validar_colaborador(atestado.colaborador_id, db)

    novo_atestado = AtestadoMedico(
        **atestado.model_dump(),
        criado_por_id=usuario.id,
        atualizado_por_id=usuario.id,
    )

    db.add(novo_atestado)
    db.commit()
    db.refresh(novo_atestado)

    return novo_atestado


@router.get("/", response_model=list[AtestadoMedicoResponse])
def listar_atestados(db: Session = Depends(get_db)):
    return (
        db.query(AtestadoMedico)
        .options(
            joinedload(AtestadoMedico.colaborador),
            joinedload(AtestadoMedico.anexos),
        )
        .filter(AtestadoMedico.removido_em.is_(None))
        .all()
    )


@router.get("/busca", response_model=AtestadosPaginadosResponse)
def buscar_atestados(
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
        db.query(AtestadoMedico)
        .options(
            joinedload(AtestadoMedico.colaborador),
            joinedload(AtestadoMedico.anexos),
        )
        .join(Colaborador, Colaborador.id == AtestadoMedico.colaborador_id)
        .filter(AtestadoMedico.removido_em.is_(None))
    )

    if q:
        termo = f"%{q.strip()}%"
        query = query.filter(
            or_(
                AtestadoMedico.cid.ilike(termo),
                AtestadoMedico.observacao.ilike(termo),
                Colaborador.nome.ilike(termo),
            )
        )

    if data_inicio:
        query = query.filter(AtestadoMedico.data_atestado >= data_inicio)

    if data_fim:
        query = query.filter(AtestadoMedico.data_atestado <= data_fim)

    total = query.count()
    items = (
        query
        .order_by(AtestadoMedico.data_atestado.desc(), AtestadoMedico.id.desc())
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


@router.post("/{atestado_id}/anexos", response_model=AnexoAtestadoResponse)
async def anexar_arquivo_atestado(
    atestado_id: int,
    arquivo: UploadFile = File(...),
    usuario=Depends(exigir_perfis("admin", "rh")),
    db: Session = Depends(get_db),
):
    obter_atestado_ou_404(atestado_id, db)
    
    nome_original = arquivo.filename or ""
    extensao_original = Path(nome_original).suffix.lower()
    
    if extensao_original not in {".pdf", ".jpg", ".jpeg", ".png", ".webp"}:
        raise HTTPException(
            status_code=400,
            detail="Extensão de arquivo não permitida.",
        )

    extensao = TIPOS_PERMITIDOS.get(arquivo.content_type or "")
    if not extensao:
        raise HTTPException(
            status_code=400,
            detail="Envie um arquivo PDF, JPG, PNG ou WEBP.",
        )

    conteudo = await arquivo.read()
    if not conteudo:
        raise HTTPException(status_code=400, detail="Arquivo vazio.")

    if len(conteudo) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Arquivo maior que 10 MB.")

    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    nome_arquivo = f"{uuid4().hex}{extensao}"
    caminho = UPLOADS_DIR / nome_arquivo
    caminho.write_bytes(conteudo)

    anexo = AnexoAtestado(
        atestado_id=atestado_id,
        nome_original=nome_original or nome_arquivo,
        nome_arquivo=nome_arquivo,
        caminho=str(caminho),
        tipo_conteudo=arquivo.content_type,
        tamanho=len(conteudo),
        criado_por_id=usuario.id,
    )

    db.add(anexo)
    db.commit()
    db.refresh(anexo)

    return anexo


@router.get("/{atestado_id}/anexos", response_model=list[AnexoAtestadoResponse])
def listar_anexos_atestado(
    atestado_id: int,
    db: Session = Depends(get_db),
):
    obter_atestado_ou_404(atestado_id, db)

    return (
        db.query(AnexoAtestado)
        .filter(AnexoAtestado.atestado_id == atestado_id)
        .order_by(AnexoAtestado.criado_em.desc(), AnexoAtestado.id.desc())
        .all()
    )


@router.get("/anexos/{anexo_id}/download")
def baixar_anexo_atestado(
    anexo_id: int,
    db: Session = Depends(get_db),
):
    anexo = obter_anexo_ou_404(anexo_id, db)
    caminho = Path(anexo.caminho)

    if not caminho.exists():
        raise HTTPException(status_code=404, detail="Arquivo não encontrado")

    return FileResponse(
        path=caminho,
        filename=anexo.nome_original,
        media_type=anexo.tipo_conteudo or "application/octet-stream",
    )


@router.delete("/anexos/{anexo_id}", status_code=204)
def excluir_anexo_atestado(
    anexo_id: int,
    usuario=Depends(exigir_perfis("admin", "rh")),
    db: Session = Depends(get_db),
):
    anexo = obter_anexo_ou_404(anexo_id, db)
    caminho = Path(anexo.caminho)

    if caminho.exists() and UPLOADS_DIR in caminho.resolve().parents:
        caminho.unlink()

    db.delete(anexo)
    db.commit()


@router.put("/{atestado_id}", response_model=AtestadoMedicoResponse)
def atualizar_atestado(
    atestado_id: int,
    dados: AtestadoMedicoUpdate,
    usuario=Depends(exigir_perfis("admin", "rh")),
    db: Session = Depends(get_db),
):
    atestado = obter_atestado_ou_404(atestado_id, db)
    campos = aplicar_campos_ocorrencia(atestado, dados)

    if "colaborador_id" in campos:
        validar_colaborador(campos["colaborador_id"], db)

    atestado.atualizado_por_id = usuario.id

    db.commit()
    db.refresh(atestado)

    return atestado


@router.delete("/{atestado_id}", status_code=204)
def excluir_atestado(
    atestado_id: int,
    usuario=Depends(exigir_perfis("admin", "rh")),
    db: Session = Depends(get_db),
):
    atestado = obter_atestado_ou_404(atestado_id, db)
    marcar_ocorrencia_removida(atestado, usuario.id)
    db.commit()
