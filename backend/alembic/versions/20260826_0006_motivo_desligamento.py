"""add collaborator termination reason

Revision ID: 20260826_0006
Revises: 20260603_0005
Create Date: 2026-08-26
"""

from alembic import op
import sqlalchemy as sa

revision = "20260826_0006"
down_revision = "20260603_0005"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "colaboradores",
        sa.Column("motivo_desligamento", sa.String(), nullable=True),
    )


def downgrade():
    op.drop_column("colaboradores", "motivo_desligamento")
