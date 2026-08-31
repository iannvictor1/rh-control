"""adiciona data limite de ferias ao colaborador

Revision ID: 20260831_0016
Revises: 20260828_0015
Create Date: 2026-08-31
"""

from alembic import op
import sqlalchemy as sa


revision = "20260831_0016"
down_revision = "20260828_0015"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "colaboradores",
        sa.Column("data_limite_ferias", sa.Date(), nullable=True),
    )


def downgrade():
    op.drop_column("colaboradores", "data_limite_ferias")
