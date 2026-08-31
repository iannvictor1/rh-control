"""add occurrence audit and soft delete

Revision ID: 20260525_0003
Revises: 20260522_0002
Create Date: 2026-05-25
"""

from alembic import op
import sqlalchemy as sa

revision = "20260525_0003"
down_revision = "20260522_0002"
branch_labels = None
depends_on = None

TABELAS = (
    "faltas",
    "advertencias",
    "suspensoes",
    "atestados_medicos",
)


def upgrade():
    for tabela in TABELAS:
        with op.batch_alter_table(tabela) as batch_op:
            batch_op.add_column(
                sa.Column("criado_em", sa.DateTime(timezone=True), nullable=True),
            )
            batch_op.add_column(
                sa.Column("atualizado_em", sa.DateTime(timezone=True), nullable=True),
            )
            batch_op.add_column(
                sa.Column("removido_em", sa.DateTime(timezone=True), nullable=True),
            )
            batch_op.add_column(sa.Column("criado_por_id", sa.Integer(), nullable=True))
            batch_op.add_column(
                sa.Column("atualizado_por_id", sa.Integer(), nullable=True),
            )
            batch_op.add_column(sa.Column("removido_por_id", sa.Integer(), nullable=True))

            batch_op.create_foreign_key(
                f"fk_{tabela}_criado_por_id_usuarios",
                "usuarios",
                ["criado_por_id"],
                ["id"],
            )
            batch_op.create_foreign_key(
                f"fk_{tabela}_atualizado_por_id_usuarios",
                "usuarios",
                ["atualizado_por_id"],
                ["id"],
            )
            batch_op.create_foreign_key(
                f"fk_{tabela}_removido_por_id_usuarios",
                "usuarios",
                ["removido_por_id"],
                ["id"],
            )


def downgrade():
    for tabela in reversed(TABELAS):
        with op.batch_alter_table(tabela) as batch_op:
            batch_op.drop_constraint(
                f"fk_{tabela}_removido_por_id_usuarios",
                type_="foreignkey",
            )
            batch_op.drop_constraint(
                f"fk_{tabela}_atualizado_por_id_usuarios",
                type_="foreignkey",
            )
            batch_op.drop_constraint(
                f"fk_{tabela}_criado_por_id_usuarios",
                type_="foreignkey",
            )

            batch_op.drop_column("removido_por_id")
            batch_op.drop_column("atualizado_por_id")
            batch_op.drop_column("criado_por_id")
            batch_op.drop_column("removido_em")
            batch_op.drop_column("atualizado_em")
            batch_op.drop_column("criado_em")
