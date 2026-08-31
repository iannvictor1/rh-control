"""add atestado anexos

Revision ID: 20260603_0005
Revises: 20260526_0004
Create Date: 2026-06-03
"""

from alembic import op
import sqlalchemy as sa

revision = "20260603_0005"
down_revision = "20260526_0004"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "atestados_anexos",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("atestado_id", sa.Integer(), nullable=False),
        sa.Column("nome_original", sa.String(), nullable=False),
        sa.Column("nome_arquivo", sa.String(), nullable=False),
        sa.Column("caminho", sa.String(), nullable=False),
        sa.Column("tipo_conteudo", sa.String(), nullable=True),
        sa.Column("tamanho", sa.Integer(), nullable=False),
        sa.Column("criado_em", sa.DateTime(timezone=True), nullable=True),
        sa.Column("criado_por_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["atestado_id"], ["atestados_medicos.id"]),
        sa.ForeignKeyConstraint(["criado_por_id"], ["usuarios.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_atestados_anexos_id", "atestados_anexos", ["id"])
    op.create_index(
        "ix_atestados_anexos_atestado_id",
        "atestados_anexos",
        ["atestado_id"],
    )


def downgrade():
    op.drop_index("ix_atestados_anexos_atestado_id", table_name="atestados_anexos")
    op.drop_index("ix_atestados_anexos_id", table_name="atestados_anexos")
    op.drop_table("atestados_anexos")
