from sqlalchemy import Column, Integer, String, Date, Boolean
from app.database import Base


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