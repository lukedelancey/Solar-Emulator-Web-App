"""Make kv ki and gamma_pmp non-nullable

Revision ID: 90609bae0e3f
Revises: 264c617922a0
Create Date: 2025-09-24 16:53:20.705003

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '90609bae0e3f'
down_revision: Union[str, Sequence[str], None] = '264c617922a0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # First, set default values for any NULL values
    op.execute("UPDATE pvmodules SET kv = 0.0 WHERE kv IS NULL")
    op.execute("UPDATE pvmodules SET ki = 0.0 WHERE ki IS NULL")
    op.execute("UPDATE pvmodules SET gamma_pmp = -0.35 WHERE gamma_pmp IS NULL")

    # Now make the columns non-nullable
    op.alter_column('pvmodules', 'kv', existing_type=sa.Float(), nullable=False)
    op.alter_column('pvmodules', 'ki', existing_type=sa.Float(), nullable=False)
    op.alter_column('pvmodules', 'gamma_pmp', existing_type=sa.Float(), nullable=False)


def downgrade() -> None:
    """Downgrade schema."""
    # Make columns nullable again
    op.alter_column('pvmodules', 'gamma_pmp', existing_type=sa.Float(), nullable=True)
    op.alter_column('pvmodules', 'ki', existing_type=sa.Float(), nullable=True)
    op.alter_column('pvmodules', 'kv', existing_type=sa.Float(), nullable=True)
