"""add sticky note open state

Revision ID: 20260827_0012
Revises: 20260827_0011
Create Date: 2026-08-27
"""

from alembic import op
import sqlalchemy as sa

revision = "20260827_0012"
down_revision = "20260827_0011"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "notas_adesivas",
        sa.Column("aberta", sa.Boolean(), nullable=False, server_default=sa.true()),
    )


def downgrade():
    op.drop_column("notas_adesivas", "aberta")
