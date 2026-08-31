from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth import (
    criar_token_acesso,
    gerar_hash_senha,
    obter_usuario_por_token,
    oauth2_scheme_optional,
    verificar_senha,
)
from app.dependencies import get_db
from app.models import Usuario
from app.schemas import LoginRequest, TokenResponse, UsuarioCreate, UsuarioResponse

router = APIRouter(
    prefix="/auth",
    tags=["Autenticação"]
)


def autenticar_usuario(email: str, senha: str, db: Session):
    email_normalizado = email.strip().lower()
    usuario = db.query(Usuario).filter(
        func.lower(Usuario.email) == email_normalizado
    ).first()

    if not usuario:
        raise HTTPException(
            status_code=401,
            detail="E-mail ou senha inválidos"
        )

    if not verificar_senha(senha, usuario.senha_hash):
        raise HTTPException(
            status_code=401,
            detail="E-mail ou senha inválidos"
        )

    if not usuario.ativo:
        raise HTTPException(
            status_code=403,
            detail="Usuário inativo"
        )

    return usuario


def criar_resposta_token(usuario: Usuario):
    token = criar_token_acesso({
        "sub": usuario.email,
        "perfil": usuario.perfil,
        "nome": usuario.nome
    })

    return {
        "access_token": token,
        "token_type": "bearer"
    }


@router.post("/registrar", response_model=UsuarioResponse)
def registrar_usuario(
    usuario: UsuarioCreate,
    token: str | None = Depends(oauth2_scheme_optional),
    db: Session = Depends(get_db)
):
    existe_usuario = db.query(Usuario).first()

    if existe_usuario:
        if not token:
            raise HTTPException(
                status_code=401,
                detail="Autenticação obrigatória"
            )

        usuario_atual = obter_usuario_por_token(token, db)

        if usuario_atual.perfil != "admin":
            raise HTTPException(
                status_code=403,
                detail="Acesso permitido apenas para administradores"
            )

    email_normalizado = usuario.email.strip().lower()
    usuario_existente = db.query(Usuario).filter(
        func.lower(Usuario.email) == email_normalizado
    ).first()

    if usuario_existente:
        raise HTTPException(
            status_code=400,
            detail="E-mail já cadastrado"
        )

    novo_usuario = Usuario(
        nome=usuario.nome,
        email=email_normalizado,
        senha_hash=gerar_hash_senha(usuario.senha),
        perfil=usuario.perfil
    )

    db.add(novo_usuario)
    db.commit()
    db.refresh(novo_usuario)

    return novo_usuario


@router.post("/login", response_model=TokenResponse)
def login(
    dados: LoginRequest,
    db: Session = Depends(get_db)
):
    usuario = autenticar_usuario(dados.email, dados.senha, db)
    return criar_resposta_token(usuario)


@router.post("/token", response_model=TokenResponse)
def login_swagger(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    usuario = autenticar_usuario(form_data.username, form_data.password, db)
    return criar_resposta_token(usuario)
