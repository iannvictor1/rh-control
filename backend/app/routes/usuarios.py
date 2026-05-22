from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth import gerar_hash_senha, obter_admin_atual
from app.dependencies import get_db
from app.models import Usuario
from app.schemas import PerfilUsuario, UsuarioResponse


class UsuarioAdminCreate(BaseModel):
    nome: str
    email: str
    senha: str
    perfil: PerfilUsuario = "rh"


class UsuarioAdminUpdate(BaseModel):
    nome: str | None = None
    email: str | None = None
    senha: str | None = None
    perfil: PerfilUsuario | None = None
    ativo: bool | None = None


router = APIRouter(
    prefix="/usuarios",
    tags=["Usuários"],
    dependencies=[Depends(obter_admin_atual)],
)


@router.get("/", response_model=list[UsuarioResponse])
def listar_usuarios(db: Session = Depends(get_db)):
    return db.query(Usuario).order_by(Usuario.nome).all()


@router.post("/", response_model=UsuarioResponse)
def criar_usuario(
    dados: UsuarioAdminCreate,
    db: Session = Depends(get_db),
):
    usuario_existente = db.query(Usuario).filter(
        Usuario.email == dados.email
    ).first()

    if usuario_existente:
        raise HTTPException(
            status_code=400,
            detail="E-mail já cadastrado",
        )

    usuario = Usuario(
        nome=dados.nome,
        email=dados.email,
        senha_hash=gerar_hash_senha(dados.senha),
        perfil=dados.perfil,
        ativo=True,
    )

    db.add(usuario)
    db.commit()
    db.refresh(usuario)

    return usuario


@router.put("/{usuario_id}", response_model=UsuarioResponse)
def atualizar_usuario(
    usuario_id: int,
    dados: UsuarioAdminUpdate,
    db: Session = Depends(get_db),
):
    usuario = db.query(Usuario).filter(
        Usuario.id == usuario_id
    ).first()

    if not usuario:
        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado",
        )

    if dados.email and dados.email != usuario.email:
        email_em_uso = db.query(Usuario).filter(
            Usuario.email == dados.email
        ).first()

        if email_em_uso:
            raise HTTPException(
                status_code=400,
                detail="E-mail já cadastrado",
            )

    campos = dados.model_dump(exclude_unset=True)
    senha = campos.pop("senha", None)

    for campo, valor in campos.items():
        setattr(usuario, campo, valor)

    if senha:
        usuario.senha_hash = gerar_hash_senha(senha)

    db.commit()
    db.refresh(usuario)

    return usuario


@router.patch("/{usuario_id}/inativar", response_model=UsuarioResponse)
def inativar_usuario(
    usuario_id: int,
    usuario_atual: Usuario = Depends(obter_admin_atual),
    db: Session = Depends(get_db),
):
    if usuario_id == usuario_atual.id:
        raise HTTPException(
            status_code=400,
            detail="Você não pode inativar seu próprio usuário",
        )

    usuario = db.query(Usuario).filter(
        Usuario.id == usuario_id
    ).first()

    if not usuario:
        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado",
        )

    usuario.ativo = False

    db.commit()
    db.refresh(usuario)

    return usuario


@router.patch("/{usuario_id}/ativar", response_model=UsuarioResponse)
def ativar_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
):
    usuario = db.query(Usuario).filter(
        Usuario.id == usuario_id
    ).first()

    if not usuario:
        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado",
        )

    usuario.ativo = True

    db.commit()
    db.refresh(usuario)

    return usuario
