from sqlalchemy import Column, Integer, String, Date, Boolean
from app.database import Base
from sqlalchemy.orm import relationship
from sqlalchemy import ForeignKey


class Colaborador(Base):
    __tablename__ = "colaboradores"

    id = Column(Integer, primary_key=True, index=True)

    nome = Column(String, nullable=False)
    data_nascimento = Column(Date, nullable=True)

    rg = Column(String, nullable=True)
    cpf = Column(String, nullable=True)

    data_admissao = Column(Date, nullable=True)

    endereco = Column(String, nullable=True)

    email = Column(String, nullable=True)
    telefone = Column(String, nullable=True)
    telefone_emergencia = Column(String, nullable=True)

    ativo = Column(Boolean, default=True)
    
class Falta(Base):
    __tablename__ = "faltas"

    id = Column(Integer, primary_key=True, index=True)

    colaborador_id = Column(
        Integer,
        ForeignKey("colaboradores.id")
    )

    data_falta = Column(Date, nullable=False)

    motivo = Column(String, nullable=True)

    colaborador = relationship("Colaborador")
    
class Advertencia(Base):
    __tablename__ = "advertencias"

    id = Column(Integer, primary_key=True, index=True)

    colaborador_id = Column(
        Integer,
        ForeignKey("colaboradores.id")
    )

    data_advertencia = Column(Date, nullable=False)

    tipo = Column(String, nullable=False)

    motivo = Column(String, nullable=False)

    colaborador = relationship("Colaborador")
    
class Suspensao(Base):
    __tablename__ = "suspensoes"

    id = Column(Integer, primary_key=True, index=True)

    colaborador_id = Column(
        Integer,
        ForeignKey("colaboradores.id")
    )

    data_inicio = Column(Date, nullable=False)

    dias = Column(Integer, nullable=False)

    motivo = Column(String, nullable=False)

    status = Column(
        String,
        default="Ativa"
    )

    colaborador = relationship("Colaborador")
    
class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)

    nome = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    senha_hash = Column(String, nullable=False)

    perfil = Column(String, default="admin")
    ativo = Column(Boolean, default=True)