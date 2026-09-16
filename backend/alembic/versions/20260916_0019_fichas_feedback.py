"""cria fichas de feedback

Revision ID: 20260916_0019
Revises: 20260910_0018
Create Date: 2026-09-16
"""

from alembic import op
import sqlalchemy as sa


revision = "20260916_0019"
down_revision = "20260910_0018"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "fichas_feedback",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("colaborador_id", sa.Integer(), nullable=False),
        sa.Column("data_ocorrencia", sa.Date(), nullable=False),
        sa.Column("ocorrencia", sa.String(), nullable=False),
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
    op.create_index(
        op.f("ix_fichas_feedback_id"),
        "fichas_feedback",
        ["id"],
        unique=False,
    )


def downgrade():
    op.drop_index(op.f("ix_fichas_feedback_id"), table_name="fichas_feedback")
    op.drop_table("fichas_feedback")
