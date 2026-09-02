"""adiciona periodo aquisitivo de ferias ao colaborador

Revision ID: 20260902_0017
Revises: 20260831_0016
Create Date: 2026-09-02
"""

from alembic import op
import sqlalchemy as sa


revision = "20260902_0017"
down_revision = "20260831_0016"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "colaboradores",
        sa.Column("data_inicio_periodo_aquisitivo", sa.Date(), nullable=True),
    )
    op.add_column(
        "colaboradores",
        sa.Column("data_fim_periodo_aquisitivo", sa.Date(), nullable=True),
    )


def downgrade():
    op.drop_column("colaboradores", "data_fim_periodo_aquisitivo")
    op.drop_column("colaboradores", "data_inicio_periodo_aquisitivo")
