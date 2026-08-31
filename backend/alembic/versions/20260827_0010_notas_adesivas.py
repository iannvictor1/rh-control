"""add sticky notes

Revision ID: 20260827_0010
Revises: 20260827_0009
Create Date: 2026-08-27
"""

from alembic import op
import sqlalchemy as sa

revision = "20260827_0010"
down_revision = "20260827_0009"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "notas_adesivas",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("usuario_id", sa.Integer(), nullable=False),
        sa.Column("titulo", sa.String(), nullable=True),
        sa.Column("conteudo", sa.String(), nullable=True),
        sa.Column("cor", sa.String(), nullable=False, server_default="amarelo"),
        sa.Column("fixada", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("criado_em", sa.DateTime(timezone=True), nullable=True),
        sa.Column("atualizado_em", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["usuario_id"], ["usuarios.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_notas_adesivas_id"),
        "notas_adesivas",
        ["id"],
        unique=False,
    )


def downgrade():
    op.drop_index(op.f("ix_notas_adesivas_id"), table_name="notas_adesivas")
    op.drop_table("notas_adesivas")
