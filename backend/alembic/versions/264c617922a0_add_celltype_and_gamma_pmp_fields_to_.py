"""Add celltype and gamma_pmp fields to PVModule

Revision ID: 264c617922a0
Revises: 3af4269daa85
Create Date: 2025-09-24 16:50:11.514673

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '264c617922a0'
down_revision: Union[str, Sequence[str], None] = '3af4269daa85'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add celltype column with default value 'monoSi'
    op.add_column('pvmodules', sa.Column('celltype', sa.String(length=32), nullable=False, server_default='monoSi'))

    # Add gamma_pmp column with default value -0.35
    op.add_column('pvmodules', sa.Column('gamma_pmp', sa.Float(), nullable=True, server_default='-0.35'))


def downgrade() -> None:
    """Downgrade schema."""
    # Remove the new columns
    op.drop_column('pvmodules', 'gamma_pmp')
    op.drop_column('pvmodules', 'celltype')
