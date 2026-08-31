"""cria tabela de experiencias concluidas

Revision ID: 20260828_0015
Revises: 20260828_0014
Create Date: 2026-08-28
"""

from alembic import op
import sqlalchemy as sa


revision = "20260828_0015"
down_revision = "20260828_0014"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "experiencias_concluidas",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("colaborador_id", sa.Integer(), nullable=False),
        sa.Column("etapa", sa.String(), nullable=False),
        sa.Column("vencimento_experiencia", sa.Date(), nullable=False),
        sa.Column("concluido_em", sa.DateTime(timezone=True), nullable=True),
        sa.Column("concluido_por_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["colaborador_id"], ["colaboradores.id"]),
        sa.ForeignKeyConstraint(["concluido_por_id"], ["usuarios.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "colaborador_id",
            "etapa",
            "vencimento_experiencia",
            name="uq_experiencias_concluidas_chave",
        ),
    )
    op.create_index(
        op.f("ix_experiencias_concluidas_id"),
        "experiencias_concluidas",
        ["id"],
        unique=False,
    )


def downgrade():
    op.drop_index(
        op.f("ix_experiencias_concluidas_id"),
        table_name="experiencias_concluidas",
    )
    op.drop_table("experiencias_concluidas")
