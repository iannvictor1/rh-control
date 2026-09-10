"""adiciona abono pecuniario em ferias

Revision ID: 20260910_0018
Revises: 20260902_0017
Create Date: 2026-09-10
"""

from alembic import op
import sqlalchemy as sa


revision = "20260910_0018"
down_revision = "20260902_0017"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "ferias",
        sa.Column(
            "abono_pecuniario",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )
    op.alter_column("ferias", "abono_pecuniario", server_default=None)


def downgrade():
    op.drop_column("ferias", "abono_pecuniario")
