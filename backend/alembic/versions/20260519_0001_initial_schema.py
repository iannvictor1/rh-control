"""initial schema

Revision ID: 20260519_0001
Revises:
Create Date: 2026-05-19
"""

from alembic import op
import sqlalchemy as sa

revision = "20260519_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "colaboradores",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("nome", sa.String(), nullable=False),
        sa.Column("data_nascimento", sa.Date(), nullable=True),
        sa.Column("rg", sa.String(), nullable=True),
        sa.Column("cpf", sa.String(), nullable=True),
        sa.Column("data_admissao", sa.Date(), nullable=True),
        sa.Column("data_aso", sa.Date(), nullable=True),
        sa.Column("endereco", sa.String(), nullable=True),
        sa.Column("email", sa.String(), nullable=True),
        sa.Column("telefone", sa.String(), nullable=True),
        sa.Column("telefone_emergencia", sa.String(), nullable=True),
        sa.Column("ativo", sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_colaboradores_id"),
        "colaboradores",
        ["id"],
        unique=False,
    )

    op.create_table(
        "usuarios",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("nome", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("senha_hash", sa.String(), nullable=False),
        sa.Column("perfil", sa.String(), nullable=False),
        sa.Column("ativo", sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_usuarios_id"), "usuarios", ["id"], unique=False)
    op.create_index(
        op.f("ix_usuarios_email"),
        "usuarios",
        ["email"],
        unique=True,
    )

    op.create_table(
        "advertencias",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("colaborador_id", sa.Integer(), nullable=False),
        sa.Column("data_advertencia", sa.Date(), nullable=False),
        sa.Column("tipo", sa.String(), nullable=False),
        sa.Column("motivo", sa.String(), nullable=False),
        sa.ForeignKeyConstraint(["colaborador_id"], ["colaboradores.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_advertencias_id"),
        "advertencias",
        ["id"],
        unique=False,
    )

    op.create_table(
        "atestados_medicos",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("colaborador_id", sa.Integer(), nullable=False),
        sa.Column("data_atestado", sa.Date(), nullable=False),
        sa.Column("cid", sa.String(), nullable=True),
        sa.Column("dias", sa.Integer(), nullable=False),
        sa.Column("observacao", sa.String(), nullable=True),
        sa.ForeignKeyConstraint(["colaborador_id"], ["colaboradores.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_atestados_medicos_id"),
        "atestados_medicos",
        ["id"],
        unique=False,
    )

    op.create_table(
        "faltas",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("colaborador_id", sa.Integer(), nullable=False),
        sa.Column("data_falta", sa.Date(), nullable=False),
        sa.Column("motivo", sa.String(), nullable=True),
        sa.ForeignKeyConstraint(["colaborador_id"], ["colaboradores.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_faltas_id"), "faltas", ["id"], unique=False)

    op.create_table(
        "suspensoes",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("colaborador_id", sa.Integer(), nullable=False),
        sa.Column("data_inicio", sa.Date(), nullable=False),
        sa.Column("dias", sa.Integer(), nullable=False),
        sa.Column("motivo", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.ForeignKeyConstraint(["colaborador_id"], ["colaboradores.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_suspensoes_id"),
        "suspensoes",
        ["id"],
        unique=False,
    )


def downgrade():
    op.drop_index(op.f("ix_suspensoes_id"), table_name="suspensoes")
    op.drop_table("suspensoes")
    op.drop_index(op.f("ix_faltas_id"), table_name="faltas")
    op.drop_table("faltas")
    op.drop_index(
        op.f("ix_atestados_medicos_id"),
        table_name="atestados_medicos",
    )
    op.drop_table("atestados_medicos")
    op.drop_index(op.f("ix_advertencias_id"), table_name="advertencias")
    op.drop_table("advertencias")
    op.drop_index(op.f("ix_usuarios_email"), table_name="usuarios")
    op.drop_index(op.f("ix_usuarios_id"), table_name="usuarios")
    op.drop_table("usuarios")
    op.drop_index(op.f("ix_colaboradores_id"), table_name="colaboradores")
    op.drop_table("colaboradores")
