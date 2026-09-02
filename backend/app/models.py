from datetime import UTC, datetime

from sqlalchemy import Column, Integer, String, Date, Boolean, DateTime, Numeric, JSON
from app.database import Base
from sqlalchemy.orm import declared_attr, relationship
from sqlalchemy import ForeignKey, UniqueConstraint


class AuditoriaOcorrenciaMixin:
    criado_em = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=True,
    )
    atualizado_em = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=True,
    )
    removido_em = Column(DateTime(timezone=True), nullable=True)

    criado_por_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    atualizado_por_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    removido_por_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)

    @declared_attr
    def criado_por(cls):
        return relationship("Usuario", foreign_keys=[cls.criado_por_id])

    @declared_attr
    def atualizado_por(cls):
        return relationship("Usuario", foreign_keys=[cls.atualizado_por_id])

    @declared_attr
    def removido_por(cls):
        return relationship("Usuario", foreign_keys=[cls.removido_por_id])


class Colaborador(Base):
    __tablename__ = "colaboradores"

    id = Column(Integer, primary_key=True, index=True)

    empresa = Column(String, nullable=True)
    nome = Column(String, nullable=False)
    matricula = Column(String, unique=True, nullable=True)
    cargo = Column(String, nullable=True)
    salario = Column(Numeric(12, 2), nullable=True)
    tipo_bonificacao = Column(String, nullable=True)
    bonificacao = Column(Numeric(12, 2), nullable=True)
    setor = Column(String, nullable=True)
    tipo_contrato = Column(String, nullable=True)
    data_nascimento = Column(Date, nullable=True)

    rg = Column(String, nullable=True)
    cpf = Column(String, unique=True, nullable=True)

    data_admissao = Column(Date, nullable=True)
    data_desligamento = Column(Date, nullable=True)
    motivo_desligamento = Column(String, nullable=True)
    data_aso = Column(Date, nullable=True)
    data_inicio_periodo_aquisitivo = Column(Date, nullable=True)
    data_fim_periodo_aquisitivo = Column(Date, nullable=True)
    data_limite_ferias = Column(Date, nullable=True)

    endereco = Column(String, nullable=True)

    email = Column(String, nullable=True)
    telefone = Column(String, nullable=True)
    telefone_emergencia = Column(String, nullable=True)
    observacoes = Column(String, nullable=True)

    ativo = Column(Boolean, default=True)
    
class Falta(AuditoriaOcorrenciaMixin, Base):
    __tablename__ = "faltas"

    id = Column(Integer, primary_key=True, index=True)

    colaborador_id = Column(
        Integer,
        ForeignKey("colaboradores.id"),
        nullable=False
    )

    data_falta = Column(Date, nullable=False)

    motivo = Column(String, nullable=True)

    colaborador = relationship("Colaborador")
    
class Advertencia(AuditoriaOcorrenciaMixin, Base):
    __tablename__ = "advertencias"

    id = Column(Integer, primary_key=True, index=True)

    colaborador_id = Column(
        Integer,
        ForeignKey("colaboradores.id"),
        nullable=False
    )

    data_advertencia = Column(Date, nullable=False)

    tipo = Column(String, nullable=False)

    motivo = Column(String, nullable=False)
    detalhes = Column(JSON, nullable=True)

    colaborador = relationship("Colaborador")
    
class Suspensao(AuditoriaOcorrenciaMixin, Base):
    __tablename__ = "suspensoes"

    id = Column(Integer, primary_key=True, index=True)

    colaborador_id = Column(
        Integer,
        ForeignKey("colaboradores.id"),
        nullable=False
    )

    data_inicio = Column(Date, nullable=False)

    dias = Column(Integer, nullable=False)

    motivo = Column(String, nullable=False)
    detalhes = Column(JSON, nullable=True)

    status = Column(
        String,
        default="Ativa"
    )

    colaborador = relationship("Colaborador")


class ExperienciaConcluida(Base):
    __tablename__ = "experiencias_concluidas"
    __table_args__ = (
        UniqueConstraint(
            "colaborador_id",
            "etapa",
            "vencimento_experiencia",
            name="uq_experiencias_concluidas_chave",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    colaborador_id = Column(
        Integer,
        ForeignKey("colaboradores.id"),
        nullable=False,
    )
    etapa = Column(String, nullable=False)
    vencimento_experiencia = Column(Date, nullable=False)
    concluido_em = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=True,
    )
    concluido_por_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)

    colaborador = relationship("Colaborador")
    concluido_por = relationship("Usuario")


class Ferias(AuditoriaOcorrenciaMixin, Base):
    __tablename__ = "ferias"

    id = Column(Integer, primary_key=True, index=True)

    colaborador_id = Column(
        Integer,
        ForeignKey("colaboradores.id"),
        nullable=False,
    )

    data_inicio = Column(Date, nullable=False)
    data_fim = Column(Date, nullable=False)
    data_retorno = Column(Date, nullable=False)
    observacoes = Column(String, nullable=True)

    colaborador = relationship("Colaborador")


class AtestadoMedico(AuditoriaOcorrenciaMixin, Base):
    __tablename__ = "atestados_medicos"

    id = Column(Integer, primary_key=True, index=True)

    colaborador_id = Column(
        Integer,
        ForeignKey("colaboradores.id"),
        nullable=False
    )

    data_atestado = Column(Date, nullable=False)
    cid = Column(String, nullable=True)
    dias = Column(Integer, nullable=False)
    observacao = Column(String, nullable=True)

    colaborador = relationship("Colaborador")
    anexos = relationship(
        "AnexoAtestado",
        back_populates="atestado",
        cascade="all, delete-orphan",
    )


class AnexoAtestado(Base):
    __tablename__ = "atestados_anexos"

    id = Column(Integer, primary_key=True, index=True)
    atestado_id = Column(
        Integer,
        ForeignKey("atestados_medicos.id"),
        nullable=False,
    )
    nome_original = Column(String, nullable=False)
    nome_arquivo = Column(String, nullable=False)
    caminho = Column(String, nullable=False)
    tipo_conteudo = Column(String, nullable=True)
    tamanho = Column(Integer, nullable=False)
    criado_em = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=True,
    )
    criado_por_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)

    atestado = relationship("AtestadoMedico", back_populates="anexos")
    criado_por = relationship("Usuario")
    
class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)

    nome = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    senha_hash = Column(String, nullable=False)

    perfil = Column(String, default="admin")
    ativo = Column(Boolean, default=True)


class NotaAdesiva(Base):
    __tablename__ = "notas_adesivas"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)

    titulo = Column(String, nullable=True)
    conteudo = Column(String, nullable=True)
    cor = Column(String, default="amarelo", nullable=False)
    fixada = Column(Boolean, default=False, nullable=False)
    aberta = Column(Boolean, default=True, nullable=False)
    posicao_x = Column(Integer, nullable=True)
    posicao_y = Column(Integer, nullable=True)

    criado_em = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=True,
    )
    atualizado_em = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=True,
    )

    usuario = relationship("Usuario")
