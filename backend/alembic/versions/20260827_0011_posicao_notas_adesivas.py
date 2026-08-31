"""add sticky note positions

Revision ID: 20260827_0011
Revises: 20260827_0010
Create Date: 2026-08-27
"""

from alembic import op
import sqlalchemy as sa

revision = "20260827_0011"
down_revision = "20260827_0010"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "notas_adesivas",
        sa.Column("posicao_x", sa.Integer(), nullable=True),
    )
    op.add_column(
        "notas_adesivas",
        sa.Column("posicao_y", sa.Integer(), nullable=True),
    )


def downgrade():
    op.drop_column("notas_adesivas", "posicao_y")
    op.drop_column("notas_adesivas", "posicao_x")
