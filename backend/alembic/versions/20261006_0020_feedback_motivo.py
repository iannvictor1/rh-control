"""Adiciona motivo separado na ficha de feedback."""

from alembic import op
import sqlalchemy as sa

revision = "20261006_0020"
down_revision = "20260916_0019"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("fichas_feedback", sa.Column("motivo", sa.String(), nullable=True))


def downgrade():
    op.drop_column("fichas_feedback", "motivo")
