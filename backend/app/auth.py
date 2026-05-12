from datetime import datetime, timedelta
import os
from jose import jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError

from app.database import SessionLocal
from app.models import Usuario

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 480)
)

if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY não configurada no ambiente")

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_db_auth():
    db = SessionLocal()
    
    try: 
        yield db
    finally:
        db.close()

def obter_usuario_atual(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db_auth)
):
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )
        
        email = payload.get("sub")
        
        if email is None:
            raise HTTPException(
                status_code=401,
                detail="Token inválido"
            )
    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Token inválido"
        )
    usuario = db.query(Usuario).filter(
        Usuario.email == email
    ).first()
    
    if not usuario or not usuario.ativo:
        raise HTTPException(
            status_code=401,
            detail="Usuárui não autorizado"
        )
    
    return usuario


def gerar_hash_senha(senha: str):
    return pwd_context.hash(senha)


def verificar_senha(senha: str, senha_hash: str):
    return pwd_context.verify(senha, senha_hash)


def criar_token_acesso(data: dict):
    dados = data.copy()

    expiracao = datetime.utcnow() + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    dados.update({"exp": expiracao})

    return jwt.encode(
        dados,
        SECRET_KEY,
        algorithm=ALGORITHM
    )