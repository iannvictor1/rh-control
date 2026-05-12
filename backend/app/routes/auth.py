from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.dependencies import get_db

from app.models import Usuario
from app.schemas import LoginRequest, TokenResponse, UsuarioCreate, UsuarioResponse
from app.auth import gerar_hash_senha, verificar_senha, criar_token_acesso

router = APIRouter(
    prefix="/auth",
    tags=["Autenticação"]
)

@router.post("/registrar", response_model=UsuarioResponse)
def registrar_usuario(
    usuario: UsuarioCreate,
    db: Session = Depends(get_db)
):
    usuario_existente = db.query(Usuario).filter(
        Usuario.email == usuario.email
    ).first()

    if usuario_existente:
        raise HTTPException(
            status_code=400,
            detail="E-mail já cadastrado"
        )

    novo_usuario = Usuario(
        nome=usuario.nome,
        email=usuario.email,
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
    usuario = db.query(Usuario).filter(
        Usuario.email == dados.email
    ).first()

    if not usuario:
        raise HTTPException(
            status_code=401,
            detail="E-mail ou senha inválidos"
        )

    if not verificar_senha(dados.senha, usuario.senha_hash):
        raise HTTPException(
            status_code=401,
            detail="E-mail ou senha inválidos"
        )

    if not usuario.ativo:
        raise HTTPException(
            status_code=403,
            detail="Usuário inativo"
        )

    token = criar_token_acesso({
        "sub": usuario.email,
        "perfil": usuario.perfil,
        "nome": usuario.nome
    })

    return {
        "access_token": token,
        "token_type": "bearer"
    }