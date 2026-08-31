"""add disciplinary occurrence details

Revision ID: 20260828_0013
Revises: 20260827_0012
Create Date: 2026-08-28
"""

from alembic import op
import sqlalchemy as sa

revision = "20260828_0013"
down_revision = "20260827_0012"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("advertencias", sa.Column("detalhes", sa.JSON(), nullable=True))
    op.add_column("suspensoes", sa.Column("detalhes", sa.JSON(), nullable=True))


def downgrade():
    op.drop_column("suspensoes", "detalhes")
    op.drop_column("advertencias", "detalhes")
