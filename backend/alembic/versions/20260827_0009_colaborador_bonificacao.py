"""add collaborator bonus fields

Revision ID: 20260827_0009
Revises: 20260826_0008
Create Date: 2026-08-27
"""

from alembic import op
import sqlalchemy as sa

revision = "20260827_0009"
down_revision = "20260826_0008"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "colaboradores",
        sa.Column("tipo_bonificacao", sa.String(), nullable=True),
    )
    op.add_column(
        "colaboradores",
        sa.Column("bonificacao", sa.Numeric(12, 2), nullable=True),
    )


def downgrade():
    op.drop_column("colaboradores", "bonificacao")
    op.drop_column("colaboradores", "tipo_bonificacao")
