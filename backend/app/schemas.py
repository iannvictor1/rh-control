from datetime import date, datetime
from decimal import Decimal
import re
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, computed_field, field_validator, model_validator


PerfilUsuario = Literal["admin", "rh", "consulta"]
TipoAdvertencia = Literal["Verbal", "Escrita"]
StatusSuspensao = Literal["Ativa", "Finalizada", "Cancelada"]
EmpresaColaborador = Literal["C&M", "Frontline"]
TipoBonificacao = Literal["Fixa", "Variavel"]
CorNotaAdesiva = Literal["amarelo", "azul", "verde", "rosa", "roxo", "cinza"]
EtapaExperiencia = Literal["45 dias", "90 dias"]


def validar_email_simples(email: str | None):
    if email is None or email == "":
        return None

    if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
        raise ValueError("E-mail inválido")

    return email


def validar_cpf_simples(cpf: str | None):
    if cpf is None or cpf == "":
        return None

    digitos = re.sub(r"\D", "", cpf)

    if len(digitos) != 11:
        raise ValueError("CPF deve ter 11 dígitos")

    return cpf


def validar_data_nao_futura(valor: date | None):
    if valor and valor > date.today():
        raise ValueError("Data não pode ser futura")

    return valor


def validar_motivo_desligamento(data_desligamento, motivo_desligamento):
    if data_desligamento and not (motivo_desligamento or "").strip():
        raise ValueError("Motivo do desligamento é obrigatório")


def validar_bonificacao_fixa(tipo_bonificacao, bonificacao):
    if tipo_bonificacao == "Fixa" and bonificacao is None:
        raise ValueError("Bonificação é obrigatória quando o tipo for Fixa")


class ColaboradorCreate(BaseModel):
    empresa: EmpresaColaborador | None = None
    nome: str
    matricula: str | None = None
    cargo: str | None = None
    salario: Decimal | None = Field(default=None, ge=0)
    tipo_bonificacao: TipoBonificacao | None = None
    bonificacao: Decimal | None = Field(default=None, ge=0)
    setor: str | None = None
    tipo_contrato: str | None = None
    data_nascimento: date | None = None
    rg: str | None = None
    cpf: str | None = None
    data_admissao: date | None = None
    data_desligamento: date | None = None
    motivo_desligamento: str | None = None
    data_aso: date | None = None
    data_inicio_periodo_aquisitivo: date | None = None
    data_fim_periodo_aquisitivo: date | None = None
    data_limite_ferias: date | None = None
    endereco: str | None = None
    email: str | None = None
    telefone: str | None = None
    telefone_emergencia: str | None = None
    observacoes: str | None = None

    @field_validator("email")
    @classmethod
    def validar_email(cls, valor):
        return validar_email_simples(valor)

    @field_validator("cpf")
    @classmethod
    def validar_cpf(cls, valor):
        return validar_cpf_simples(valor)

    @field_validator(
        "data_nascimento",
        "data_admissao",
        "data_desligamento",
    )
    @classmethod
    def validar_datas(cls, valor):
        return validar_data_nao_futura(valor)

    @model_validator(mode="after")
    def validar_desligamento(self):
        validar_motivo_desligamento(
            self.data_desligamento,
            self.motivo_desligamento,
        )
        validar_bonificacao_fixa(
            self.tipo_bonificacao,
            self.bonificacao,
        )
        return self


class ColaboradorUpdate(BaseModel):
    empresa: EmpresaColaborador | None = None
    nome: str | None = None
    matricula: str | None = None
    cargo: str | None = None
    salario: Decimal | None = Field(default=None, ge=0)
    tipo_bonificacao: TipoBonificacao | None = None
    bonificacao: Decimal | None = Field(default=None, ge=0)
    setor: str | None = None
    tipo_contrato: str | None = None
    data_nascimento: date | None = None
    rg: str | None = None
    cpf: str | None = None
    data_admissao: date | None = None
    data_desligamento: date | None = None
    motivo_desligamento: str | None = None
    data_aso: date | None = None
    data_inicio_periodo_aquisitivo: date | None = None
    data_fim_periodo_aquisitivo: date | None = None
    data_limite_ferias: date | None = None
    endereco: str | None = None
    email: str | None = None
    telefone: str | None = None
    telefone_emergencia: str | None = None
    observacoes: str | None = None
    ativo: bool | None = None

    @field_validator("email")
    @classmethod
    def validar_email(cls, valor):
        return validar_email_simples(valor)

    @field_validator("cpf")
    @classmethod
    def validar_cpf(cls, valor):
        return validar_cpf_simples(valor)

    @field_validator(
        "data_nascimento",
        "data_admissao",
        "data_desligamento",
    )
    @classmethod
    def validar_datas(cls, valor):
        return validar_data_nao_futura(valor)

    @model_validator(mode="after")
    def validar_desligamento(self):
        validar_motivo_desligamento(
            self.data_desligamento,
            self.motivo_desligamento,
        )
        validar_bonificacao_fixa(
            self.tipo_bonificacao,
            self.bonificacao,
        )
        return self


class ColaboradorResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    empresa: EmpresaColaborador | None = None
    nome: str
    matricula: str | None = None
    cargo: str | None = None
    salario: Decimal | None = None
    tipo_bonificacao: TipoBonificacao | None = None
    bonificacao: Decimal | None = None
    setor: str | None = None
    tipo_contrato: str | None = None
    data_nascimento: date | None = None
    rg: str | None = None
    cpf: str | None = None
    data_admissao: date | None = None
    data_desligamento: date | None = None
    motivo_desligamento: str | None = None
    data_aso: date | None = None
    data_inicio_periodo_aquisitivo: date | None = None
    data_fim_periodo_aquisitivo: date | None = None
    data_limite_ferias: date | None = None
    endereco: str | None = None
    email: str | None = None
    telefone: str | None = None
    telefone_emergencia: str | None = None
    observacoes: str | None = None
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


class ColaboradorOpcaoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    ativo: bool


class ColaboradoresPaginadosResponse(BaseModel):
    items: list[ColaboradorResponse]
    total: int
    skip: int
    limit: int


class UsuarioResumoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    email: str


class NotaAdesivaCreate(BaseModel):
    titulo: str | None = None
    conteudo: str | None = None
    cor: CorNotaAdesiva = "amarelo"
    fixada: bool = False
    aberta: bool = True
    posicao_x: int | None = Field(default=None, ge=0)
    posicao_y: int | None = Field(default=None, ge=0)


class NotaAdesivaUpdate(BaseModel):
    titulo: str | None = None
    conteudo: str | None = None
    cor: CorNotaAdesiva | None = None
    fixada: bool | None = None
    aberta: bool | None = None
    posicao_x: int | None = Field(default=None, ge=0)
    posicao_y: int | None = Field(default=None, ge=0)


class NotaAdesivaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    usuario_id: int
    titulo: str | None = None
    conteudo: str | None = None
    cor: CorNotaAdesiva
    fixada: bool
    aberta: bool
    posicao_x: int | None = None
    posicao_y: int | None = None
    criado_em: datetime | None = None
    atualizado_em: datetime | None = None


class AuditoriaOcorrenciaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    criado_em: datetime | None = None
    atualizado_em: datetime | None = None
    removido_em: datetime | None = None
    criado_por_id: int | None = None
    atualizado_por_id: int | None = None
    removido_por_id: int | None = None
    criado_por: UsuarioResumoResponse | None = None
    atualizado_por: UsuarioResumoResponse | None = None
    removido_por: UsuarioResumoResponse | None = None


class FaltaCreate(BaseModel):
    colaborador_id: int
    data_falta: date
    motivo: str | None = None

    @field_validator("data_falta")
    @classmethod
    def validar_data(cls, valor):
        return validar_data_nao_futura(valor)


class FaltaUpdate(BaseModel):
    colaborador_id: int | None = None
    data_falta: date | None = None
    motivo: str | None = None

    @field_validator("data_falta")
    @classmethod
    def validar_data(cls, valor):
        return validar_data_nao_futura(valor)


class FaltaResponse(AuditoriaOcorrenciaResponse):
    model_config = ConfigDict(from_attributes=True)

    id: int
    colaborador_id: int
    colaborador: ColaboradorOpcaoResponse | None = None
    data_falta: date
    motivo: str | None = None


class FaltasPaginadasResponse(BaseModel):
    items: list[FaltaResponse]
    total: int
    skip: int
    limit: int


class AdvertenciaCreate(BaseModel):
    colaborador_id: int
    data_advertencia: date
    tipo: TipoAdvertencia
    motivo: str
    detalhes: dict[str, Any] | None = None

    @field_validator("data_advertencia")
    @classmethod
    def validar_data(cls, valor):
        return validar_data_nao_futura(valor)


class AdvertenciaUpdate(BaseModel):
    colaborador_id: int | None = None
    data_advertencia: date | None = None
    tipo: TipoAdvertencia | None = None
    motivo: str | None = None
    detalhes: dict[str, Any] | None = None

    @field_validator("data_advertencia")
    @classmethod
    def validar_data(cls, valor):
        return validar_data_nao_futura(valor)


class AdvertenciaResponse(AuditoriaOcorrenciaResponse):
    model_config = ConfigDict(from_attributes=True)

    id: int
    colaborador_id: int
    colaborador: ColaboradorOpcaoResponse | None = None
    data_advertencia: date
    tipo: TipoAdvertencia
    motivo: str
    detalhes: dict[str, Any] | None = None


class AdvertenciasPaginadasResponse(BaseModel):
    items: list[AdvertenciaResponse]
    total: int
    skip: int
    limit: int


class SuspensaoCreate(BaseModel):
    colaborador_id: int
    data_inicio: date
    dias: int = Field(ge=1)
    motivo: str
    detalhes: dict[str, Any] | None = None

    @field_validator("data_inicio")
    @classmethod
    def validar_data(cls, valor):
        return validar_data_nao_futura(valor)


class SuspensaoUpdate(BaseModel):
    colaborador_id: int | None = None
    data_inicio: date | None = None
    dias: int | None = Field(default=None, ge=1)
    motivo: str | None = None
    status: StatusSuspensao | None = None
    detalhes: dict[str, Any] | None = None

    @field_validator("data_inicio")
    @classmethod
    def validar_data(cls, valor):
        return validar_data_nao_futura(valor)


class SuspensaoResponse(AuditoriaOcorrenciaResponse):
    model_config = ConfigDict(from_attributes=True)

    id: int
    colaborador_id: int
    colaborador: ColaboradorOpcaoResponse | None = None
    data_inicio: date
    dias: int
    motivo: str
    status: str
    detalhes: dict[str, Any] | None = None


class SuspensoesPaginadasResponse(BaseModel):
    items: list[SuspensaoResponse]
    total: int
    skip: int
    limit: int


class FeriasCreate(BaseModel):
    colaborador_id: int
    data_inicio: date
    data_fim: date
    data_retorno: date
    observacoes: str | None = None

    @model_validator(mode="after")
    def validar_periodo(self):
        if self.data_fim < self.data_inicio:
            raise ValueError("Data final deve ser maior ou igual à data inicial")

        if self.data_retorno <= self.data_fim:
            raise ValueError("Data de retorno deve ser posterior à data final")

        return self


class FeriasUpdate(BaseModel):
    colaborador_id: int | None = None
    data_inicio: date | None = None
    data_fim: date | None = None
    data_retorno: date | None = None
    observacoes: str | None = None

    @model_validator(mode="after")
    def validar_periodo(self):
        if self.data_inicio and self.data_fim and self.data_fim < self.data_inicio:
            raise ValueError("Data final deve ser maior ou igual à data inicial")

        if self.data_fim and self.data_retorno and self.data_retorno <= self.data_fim:
            raise ValueError("Data de retorno deve ser posterior à data final")

        return self


class FeriasResponse(AuditoriaOcorrenciaResponse):
    model_config = ConfigDict(from_attributes=True)

    id: int
    colaborador_id: int
    colaborador: ColaboradorOpcaoResponse | None = None
    data_inicio: date
    data_fim: date
    data_retorno: date
    observacoes: str | None = None


class FeriasPaginadasResponse(BaseModel):
    items: list[FeriasResponse]
    total: int
    skip: int
    limit: int


class AtestadoMedicoCreate(BaseModel):
    colaborador_id: int
    data_atestado: date
    cid: str | None = None
    dias: int = Field(ge=1)
    observacao: str | None = None

    @field_validator("data_atestado")
    @classmethod
    def validar_data(cls, valor):
        return validar_data_nao_futura(valor)


class AtestadoMedicoUpdate(BaseModel):
    colaborador_id: int | None = None
    data_atestado: date | None = None
    cid: str | None = None
    dias: int | None = Field(default=None, ge=1)
    observacao: str | None = None

    @field_validator("data_atestado")
    @classmethod
    def validar_data(cls, valor):
        return validar_data_nao_futura(valor)


class AnexoAtestadoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    atestado_id: int
    nome_original: str
    tipo_conteudo: str | None = None
    tamanho: int
    criado_em: datetime | None = None


class AtestadoMedicoResponse(AuditoriaOcorrenciaResponse):
    model_config = ConfigDict(from_attributes=True)

    id: int
    colaborador_id: int
    colaborador: ColaboradorOpcaoResponse | None = None
    data_atestado: date
    cid: str | None = None
    dias: int
    observacao: str | None = None
    anexos: list[AnexoAtestadoResponse] = []


class AtestadosPaginadosResponse(BaseModel):
    items: list[AtestadoMedicoResponse]
    total: int
    skip: int
    limit: int


class ColaboradorDetalheResponse(BaseModel):
    colaborador: ColaboradorResponse
    faltas: list[FaltaResponse]
    advertencias: list[AdvertenciaResponse]
    suspensoes: list[SuspensaoResponse]
    atestados: list[AtestadoMedicoResponse]


class UsuarioCreate(BaseModel):
    nome: str
    email: str
    senha: str
    perfil: PerfilUsuario = "admin"

    @field_validator("email")
    @classmethod
    def validar_email(cls, valor):
        return validar_email_simples(valor)


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

    @field_validator("email")
    @classmethod
    def validar_email(cls, valor):
        return validar_email_simples(valor)
    
class UsuarioCreateAdmin(BaseModel):
    nome: str
    email: str
    senha: str
    perfil: PerfilUsuario = "rh"

    @field_validator("email")
    @classmethod
    def validar_email(cls, valor):
        return validar_email_simples(valor)


class LoginRequest(BaseModel):
    email: str
    senha: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str


class DashboardResumoResponse(BaseModel):
    total_colaboradores: int
    ativos: int
    inativos: int
    faltas_mes: int
    atestados_mes: int
    advertencias_mes: int
    suspensoes_mes: int
    asos_vencidos: int
    asos_vencendo_30_dias: int
    experiencias_vencidas: int
    experiencias_vencendo_30_dias: int
    ferias_vencidas: int
    ferias_vencendo_30_dias: int


class DashboardAsoResponse(BaseModel):
    id: int
    nome: str
    data_aso: date
    vencimento_aso: date
    status: str
    dias_para_vencer: int


class DashboardExperienciaResponse(BaseModel):
    id: int
    nome: str
    data_admissao: date
    etapa: str
    vencimento_experiencia: date
    status: str
    dias_para_vencer: int


class ExperienciaConcluidaCreate(BaseModel):
    etapa: EtapaExperiencia
    vencimento_experiencia: date


class ExperienciaConcluidaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    colaborador_id: int
    etapa: str
    vencimento_experiencia: date
    concluido_em: datetime | None = None
    concluido_por_id: int | None = None


class DashboardFeriasResponse(BaseModel):
    id: int
    nome: str
    data_admissao: date
    data_base_ferias: date
    data_fim_periodo_aquisitivo: date | None = None
    vencimento_ferias: date
    data_limite_ferias: date | None = None
    status: str
    dias_para_vencer: int


class DashboardScoreResponse(BaseModel):
    id: int
    nome: str
    score: int
    nivel: str


class DashboardMensalResponse(BaseModel):
    mes: str
    faltas: int
    atestados: int
    advertencias: int
    suspensoes: int


class DashboardSetorResponse(BaseModel):
    setor: str
    total: int


class CalendarioEventoResponse(BaseModel):
    id: str
    tipo: str
    titulo: str
    data_inicio: date
    data_fim: date | None = None
    colaborador_id: int
    colaborador_nome: str
    descricao: str | None = None
    status: str | None = None
