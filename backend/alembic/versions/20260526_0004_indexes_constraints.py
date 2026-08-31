"""add indexes and collaborator unique constraints

Revision ID: 20260526_0004
Revises: 20260525_0003
Create Date: 2026-05-26
"""

from alembic import op
import sqlalchemy as sa

revision = "20260526_0004"
down_revision = "20260525_0003"
branch_labels = None
depends_on = None


def validar_sem_duplicidades(tabela: str, coluna: str):
    bind = op.get_bind()
    resultado = bind.execute(sa.text(f"""
        SELECT {coluna}
        FROM {tabela}
        WHERE {coluna} IS NOT NULL AND {coluna} <> ''
        GROUP BY {coluna}
        HAVING COUNT(*) > 1
        LIMIT 1
    """)).first()

    if resultado:
        valor = resultado[0]
        raise RuntimeError(
            f"Não foi possível criar índice único em {tabela}.{coluna}: "
            f"valor duplicado encontrado ({valor})."
        )


def upgrade():
    validar_sem_duplicidades("colaboradores", "cpf")
    validar_sem_duplicidades("colaboradores", "matricula")

    op.create_index(
        "ix_colaboradores_cpf_unique",
        "colaboradores",
        ["cpf"],
        unique=True,
    )
    op.create_index(
        "ix_colaboradores_matricula_unique",
        "colaboradores",
        ["matricula"],
        unique=True,
    )

    op.create_index("ix_faltas_data_falta", "faltas", ["data_falta"])
    op.create_index(
        "ix_advertencias_data_advertencia",
        "advertencias",
        ["data_advertencia"],
    )
    op.create_index("ix_suspensoes_data_inicio", "suspensoes", ["data_inicio"])
    op.create_index(
        "ix_atestados_medicos_data_atestado",
        "atestados_medicos",
        ["data_atestado"],
    )


def downgrade():
    op.drop_index("ix_atestados_medicos_data_atestado", table_name="atestados_medicos")
    op.drop_index("ix_suspensoes_data_inicio", table_name="suspensoes")
    op.drop_index("ix_advertencias_data_advertencia", table_name="advertencias")
    op.drop_index("ix_faltas_data_falta", table_name="faltas")
    op.drop_index("ix_colaboradores_matricula_unique", table_name="colaboradores")
    op.drop_index("ix_colaboradores_cpf_unique", table_name="colaboradores")
