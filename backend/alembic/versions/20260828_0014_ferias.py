"""add vacation records

Revision ID: 20260828_0014
Revises: 20260828_0013
Create Date: 2026-08-28
"""

from alembic import op
import sqlalchemy as sa

revision = "20260828_0014"
down_revision = "20260828_0013"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "ferias",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("colaborador_id", sa.Integer(), nullable=False),
        sa.Column("data_inicio", sa.Date(), nullable=False),
        sa.Column("data_fim", sa.Date(), nullable=False),
        sa.Column("data_retorno", sa.Date(), nullable=False),
        sa.Column("observacoes", sa.String(), nullable=True),
        sa.Column("criado_em", sa.DateTime(timezone=True), nullable=True),
        sa.Column("atualizado_em", sa.DateTime(timezone=True), nullable=True),
        sa.Column("removido_em", sa.DateTime(timezone=True), nullable=True),
        sa.Column("criado_por_id", sa.Integer(), nullable=True),
        sa.Column("atualizado_por_id", sa.Integer(), nullable=True),
        sa.Column("removido_por_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["atualizado_por_id"], ["usuarios.id"]),
        sa.ForeignKeyConstraint(["colaborador_id"], ["colaboradores.id"]),
        sa.ForeignKeyConstraint(["criado_por_id"], ["usuarios.id"]),
        sa.ForeignKeyConstraint(["removido_por_id"], ["usuarios.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_ferias_id"), "ferias", ["id"], unique=False)
    op.create_index("ix_ferias_colaborador_inicio", "ferias", ["colaborador_id", "data_inicio"], unique=False)


def downgrade():
    op.drop_index("ix_ferias_colaborador_inicio", table_name="ferias")
    op.drop_index(op.f("ix_ferias_id"), table_name="ferias")
    op.drop_table("ferias")
