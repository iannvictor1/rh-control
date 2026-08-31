"""add collaborator salary

Revision ID: 20260826_0008
Revises: 20260826_0007
Create Date: 2026-08-26
"""

from alembic import op
import sqlalchemy as sa

revision = "20260826_0008"
down_revision = "20260826_0007"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "colaboradores",
        sa.Column("salario", sa.Numeric(12, 2), nullable=True),
    )


def downgrade():
    op.drop_column("colaboradores", "salario")
