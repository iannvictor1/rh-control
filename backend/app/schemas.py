from pydantic import BaseModel
from datetime import date


class ColaboradorCreate(BaseModel):
    nome: str
    data_nascimento: date | None = None
    rg: str | None = None
    cpf: str | None = None
    data_admissao: date | None = None
    endereco: str | None = None
    email: str | None = None
    telefone: str | None = None
    telefone_emergencia: str | None = None
    
class ColaboradorUpdate(BaseModel):
    nome: str | None = None
    data_nascimento: date | None = None
    rg: str | None = None
    cpf: str | None = None
    data_admissao: date | None = None
    endereco: str | None = None
    email: str | None = None
    telefone: str | None = None
    telefone_emergencia: str | None = None
    ativo: bool | None = None


class ColaboradorResponse(ColaboradorCreate):
    id: int
    ativo: bool

    class Config:
        from_attributes = True
        
class FaltaCreate(BaseModel):
    colaborador_id: int
    data_falta: date
    motivo: str | None = None


class FaltaResponse(FaltaCreate):
    id: int

    class Config:
        from_attributes = True
        
class AdvertenciaCreate(BaseModel):
    colaborador_id: int
    data_advertencia: date
    tipo: str
    motivo: str


class AdvertenciaResponse(AdvertenciaCreate):
    id: int

    class Config:
        from_attributes = True
        
class SuspensaoCreate(BaseModel):
    colaborador_id: int
    data_inicio: date
    dias: int
    motivo: str


class SuspensaoResponse(SuspensaoCreate):
    id: int
    status: str

    class Config:
        from_attributes = True

class UsuarioCreate(BaseModel):
    nome: str
    email: str
    senha: str
    perfil: str = "admin"


class UsuarioResponse(BaseModel):
    id: int
    nome: str
    email: str
    perfil: str
    ativo: bool

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    email: str
    senha: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str