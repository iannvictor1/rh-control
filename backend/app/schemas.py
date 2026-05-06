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


class ColaboradorResponse(ColaboradorCreate):
    id: int
    ativo: bool

    class Config:
        from_attributes = True