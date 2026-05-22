"""multi-item access requests: add access_request_items table

Revision ID: a1b2c3d4e5f6
Revises: 80c710c5d200
Create Date: 2026-05-22 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '80c710c5d200'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'access_request_items',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('access_request_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('stored_item_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(['access_request_id'], ['access_requests.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['stored_item_id'], ['stored_items.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('access_request_id', 'stored_item_id', name='uq_access_request_item'),
    )
    op.create_index('ix_access_request_items_access_request_id', 'access_request_items', ['access_request_id'])
    op.create_index('ix_access_request_items_stored_item_id', 'access_request_items', ['stored_item_id'])

    # Migrate existing single-item data into the new junction table
    op.execute("""
        INSERT INTO access_request_items (id, created_at, updated_at, access_request_id, stored_item_id)
        SELECT gen_random_uuid(), now(), now(), id, stored_item_id
        FROM access_requests
        WHERE stored_item_id IS NOT NULL
    """)

    # Make the legacy stored_item_id nullable
    op.alter_column('access_requests', 'stored_item_id',
                    existing_type=postgresql.UUID(as_uuid=True),
                    nullable=True)


def downgrade() -> None:
    # Restore stored_item_id from junction table (take first item per request)
    op.execute("""
        UPDATE access_requests ar
        SET stored_item_id = (
            SELECT stored_item_id FROM access_request_items
            WHERE access_request_id = ar.id
            ORDER BY created_at
            LIMIT 1
        )
        WHERE stored_item_id IS NULL
    """)

    op.alter_column('access_requests', 'stored_item_id',
                    existing_type=postgresql.UUID(as_uuid=True),
                    nullable=False)

    op.drop_index('ix_access_request_items_stored_item_id', table_name='access_request_items')
    op.drop_index('ix_access_request_items_access_request_id', table_name='access_request_items')
    op.drop_table('access_request_items')
