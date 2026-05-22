from pydantic import BaseModel, ConfigDict, computed_field
from datetime import date
from typing import Literal


PerfilUsuario = Literal["admin", "rh", "consulta"]


class ColaboradorCreate(BaseModel):
    nome: str
    matricula: str | None = None
    cargo: str | None = None
    setor: str | None = None
    tipo_contrato: str | None = None
    data_nascimento: date | None = None
    rg: str | None = None
    cpf: str | None = None
    data_admissao: date | None = None
    data_desligamento: date | None = None
    data_aso: date | None = None
    endereco: str | None = None
    email: str | None = None
    telefone: str | None = None
    telefone_emergencia: str | None = None
    observacoes: str | None = None
    
class ColaboradorUpdate(BaseModel):
    nome: str | None = None
    matricula: str | None = None
    cargo: str | None = None
    setor: str | None = None
    tipo_contrato: str | None = None
    data_nascimento: date | None = None
    rg: str | None = None
    cpf: str | None = None
    data_admissao: date | None = None
    data_desligamento: date | None = None
    data_aso: date | None = None
    endereco: str | None = None
    email: str | None = None
    telefone: str | None = None
    telefone_emergencia: str | None = None
    observacoes: str | None = None
    ativo: bool | None = None


class ColaboradorResponse(ColaboradorCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    ativo: bool

    @computed_field
    @property
    def vencimento_aso(self) -> date | None:
        if not self.data_aso:
            return None

        try:
            return self.data_aso.replace(year=self.data_aso.year + 1)
        except ValueError:
            return self.data_aso.replace(
                year=self.data_aso.year + 1,
                day=28
            )


class FaltaCreate(BaseModel):
    colaborador_id: int
    data_falta: date
    motivo: str | None = None


class FaltaUpdate(BaseModel):
    colaborador_id: int | None = None
    data_falta: date | None = None
    motivo: str | None = None


class FaltaResponse(FaltaCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int


class AdvertenciaCreate(BaseModel):
    colaborador_id: int
    data_advertencia: date
    tipo: str
    motivo: str


class AdvertenciaUpdate(BaseModel):
    colaborador_id: int | None = None
    data_advertencia: date | None = None
    tipo: str | None = None
    motivo: str | None = None


class AdvertenciaResponse(AdvertenciaCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int


class SuspensaoCreate(BaseModel):
    colaborador_id: int
    data_inicio: date
    dias: int
    motivo: str


class SuspensaoUpdate(BaseModel):
    colaborador_id: int | None = None
    data_inicio: date | None = None
    dias: int | None = None
    motivo: str | None = None
    status: str | None = None


class SuspensaoResponse(SuspensaoCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: str


class AtestadoMedicoCreate(BaseModel):
    colaborador_id: int
    data_atestado: date
    cid: str | None = None
    dias: int
    observacao: str | None = None


class AtestadoMedicoUpdate(BaseModel):
    colaborador_id: int | None = None
    data_atestado: date | None = None
    cid: str | None = None
    dias: int | None = None
    observacao: str | None = None


class AtestadoMedicoResponse(AtestadoMedicoCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int



class UsuarioCreate(BaseModel):
    nome: str
    email: str
    senha: str
    perfil: PerfilUsuario = "admin"


class UsuarioResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    email: str
    perfil: PerfilUsuario
    ativo: bool
    
class UsuarioUpdate(BaseModel):
    nome: str | None = None
    email: str | None = None
    perfil: PerfilUsuario | None = None
    ativo: bool | None = None
    
class UsuarioCreateAdmin(BaseModel):
    nome: str
    email: str
    senha: str
    perfil: PerfilUsuario = "rh"


class LoginRequest(BaseModel):
    email: str
    senha: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
