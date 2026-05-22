"""add collaborator hr fields

Revision ID: 20260522_0002
Revises: 20260519_0001
Create Date: 2026-05-22
"""

from alembic import op
import sqlalchemy as sa

revision = "20260522_0002"
down_revision = "20260519_0001"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("colaboradores", sa.Column("matricula", sa.String(), nullable=True))
    op.add_column("colaboradores", sa.Column("cargo", sa.String(), nullable=True))
    op.add_column("colaboradores", sa.Column("setor", sa.String(), nullable=True))
    op.add_column("colaboradores", sa.Column("tipo_contrato", sa.String(), nullable=True))
    op.add_column("colaboradores", sa.Column("data_desligamento", sa.Date(), nullable=True))
    op.add_column("colaboradores", sa.Column("observacoes", sa.String(), nullable=True))


def downgrade():
    op.drop_column("colaboradores", "observacoes")
    op.drop_column("colaboradores", "data_desligamento")
    op.drop_column("colaboradores", "tipo_contrato")
    op.drop_column("colaboradores", "setor")
    op.drop_column("colaboradores", "cargo")
    op.drop_column("colaboradores", "matricula")
