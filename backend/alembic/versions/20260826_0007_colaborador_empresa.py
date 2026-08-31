"""add collaborator company

Revision ID: 20260826_0007
Revises: 20260826_0006
Create Date: 2026-08-26
"""

from alembic import op
import sqlalchemy as sa

revision = "20260826_0007"
down_revision = "20260826_0006"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "colaboradores",
        sa.Column("empresa", sa.String(), nullable=True),
    )
    op.execute("UPDATE colaboradores SET empresa = 'C&M' WHERE empresa IS NULL")


def downgrade():
    op.drop_column("colaboradores", "empresa")
