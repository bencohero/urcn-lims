"""initial_schema

Revision ID: 3eacf90caf4e
Revises:
Create Date: 2026-02-04 23:44:41.187605

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '3eacf90caf4e'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # === ROLES ===
    op.create_table(
        'roles',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(100), unique=True, nullable=False),
        sa.Column('code', sa.String(50), unique=True, nullable=False, index=True),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('permissions', postgresql.JSONB, nullable=False),
        sa.Column('is_system_role', sa.Boolean, default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )

    # === USERS ===
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('username', sa.String(100), unique=True, nullable=False, index=True),
        sa.Column('email', sa.String(255), unique=True, nullable=False, index=True),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('first_name', sa.String(100), nullable=False),
        sa.Column('last_name', sa.String(100), nullable=False),
        sa.Column('phone', sa.String(20), nullable=True),
        sa.Column('is_active', sa.Boolean, default=True, index=True),
        sa.Column('is_superuser', sa.Boolean, default=False),
        sa.Column('last_login', sa.DateTime(timezone=True), nullable=True),
        sa.Column('failed_login_attempts', sa.Integer, default=0),
        sa.Column('locked_until', sa.DateTime(timezone=True), nullable=True),
        sa.Column('mfa_enabled', sa.Boolean, default=False),
        sa.Column('mfa_secret', sa.String(255), nullable=True),
        sa.Column('password_changed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('updated_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )

    # === STUDIES ===
    op.create_table(
        'studies',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('protocol_number', sa.String(100), unique=True, nullable=False, index=True),
        sa.Column('title', sa.String(500), nullable=False),
        sa.Column('sponsor', sa.String(255), nullable=True),
        sa.Column('phase', sa.String(50), nullable=True),
        sa.Column('therapeutic_area', sa.String(255), nullable=True),
        sa.Column('start_date', sa.Date, nullable=True),
        sa.Column('end_date', sa.Date, nullable=True),
        sa.Column('estimated_enrollment', sa.Integer, nullable=True),
        sa.Column('status', sa.String(50), default='ACTIVE', nullable=False, index=True),
        sa.Column('retention_period_years', sa.Integer, default=10),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('meta_data', postgresql.JSONB, nullable=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('updated_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )

    # === SITES ===
    op.create_table(
        'sites',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('study_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('studies.id', ondelete='RESTRICT'), nullable=False, index=True),
        sa.Column('principal_investigator_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('site_number', sa.String(50), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('country', sa.String(100), nullable=False, index=True),
        sa.Column('city', sa.String(100), nullable=False),
        sa.Column('address', sa.Text, nullable=True),
        sa.Column('postal_code', sa.String(20), nullable=True),
        sa.Column('phone', sa.String(20), nullable=True),
        sa.Column('email', sa.String(255), nullable=True),
        sa.Column('status', sa.String(50), default='ACTIVE', nullable=False, index=True),
        sa.Column('activation_date', sa.Date, nullable=True),
        sa.Column('closure_date', sa.Date, nullable=True),
        sa.Column('has_offline_capability', sa.Boolean, default=False),
        sa.Column('timezone', sa.String(50), default='UTC'),
        sa.Column('meta_data', postgresql.JSONB, nullable=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('updated_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.UniqueConstraint('study_id', 'site_number', name='uq_sites_study_site_number'),
    )

    # === SITE_USERS ===
    op.create_table(
        'site_users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('site_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('sites.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('role_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('roles.id', ondelete='RESTRICT'), nullable=False, index=True),
        sa.Column('is_primary', sa.Boolean, default=False),
        sa.Column('assigned_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('unassigned_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.UniqueConstraint('user_id', 'site_id', 'role_id', name='uq_site_users_user_site_role'),
    )

    # === STORAGE_LOCATIONS ===
    op.create_table(
        'storage_locations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('site_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('sites.id', ondelete='RESTRICT'), nullable=False, index=True),
        sa.Column('parent_location_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('storage_locations.id', ondelete='SET NULL'), nullable=True, index=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('code', sa.String(50), nullable=True, index=True),
        sa.Column('location_type', sa.String(50), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('floor', sa.String(20), nullable=True),
        sa.Column('building', sa.String(100), nullable=True),
        sa.Column('temperature_controlled', sa.Boolean, default=False),
        sa.Column('temperature_min', sa.Numeric(5, 2), nullable=True),
        sa.Column('temperature_max', sa.Numeric(5, 2), nullable=True),
        sa.Column('humidity_controlled', sa.Boolean, default=False),
        sa.Column('access_restricted', sa.Boolean, default=False),
        sa.Column('capacity_cubic_meters', sa.Numeric(10, 2), nullable=True),
        sa.Column('current_usage_percent', sa.Numeric(5, 2), default=0.0, nullable=False),
        sa.Column('status', sa.String(50), default='ACTIVE', nullable=False, index=True),
        sa.Column('meta_data', postgresql.JSONB, nullable=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('updated_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )

    # === CONTAINERS ===
    op.create_table(
        'containers',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('location_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('storage_locations.id', ondelete='RESTRICT'), nullable=False, index=True),
        sa.Column('parent_container_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('containers.id', ondelete='SET NULL'), nullable=True, index=True),
        sa.Column('container_type', sa.String(50), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('code', sa.String(50), nullable=True),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('capacity_items', sa.Integer, nullable=True),
        sa.Column('current_count', sa.Integer, default=0, nullable=False),
        sa.Column('dimensions_cm', sa.String(50), nullable=True),
        sa.Column('material', sa.String(100), nullable=True),
        sa.Column('locked', sa.Boolean, default=False),
        sa.Column('barcode', sa.String(255), nullable=True, index=True),
        sa.Column('status', sa.String(50), default='ACTIVE', nullable=False, index=True),
        sa.Column('meta_data', postgresql.JSONB, nullable=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('updated_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )

    # === STORED_ITEMS (base table for polymorphic inheritance) ===
    op.create_table(
        'stored_items',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('item_type', sa.String(50), nullable=False, index=True),
        sa.Column('study_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('studies.id', ondelete='RESTRICT'), nullable=False, index=True),
        sa.Column('site_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('sites.id', ondelete='RESTRICT'), nullable=False, index=True),
        sa.Column('container_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('containers.id', ondelete='SET NULL'), nullable=True, index=True),
        sa.Column('internal_code', sa.String(100), nullable=True, index=True),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('quantity', sa.Integer, default=1, nullable=False),
        sa.Column('unit', sa.String(50), nullable=True),
        sa.Column('status', sa.String(50), default='IN_STORAGE', nullable=False, index=True),
        sa.Column('storage_date', sa.Date, nullable=False),
        sa.Column('expected_retention_until', sa.Date, nullable=True),
        sa.Column('physical_condition', sa.String(50), default='GOOD', nullable=False),
        sa.Column('location_notes', sa.Text, nullable=True),
        sa.Column('meta_data', postgresql.JSONB, nullable=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('updated_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )

    # === DOCUMENTS (inherits from stored_items) ===
    op.create_table(
        'documents',
        sa.Column('id', postgresql.UUID(as_uuid=True), sa.ForeignKey('stored_items.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('document_type', sa.String(100), nullable=False, index=True),
        sa.Column('subject_id', sa.String(100), nullable=True, index=True),
        sa.Column('visit_number', sa.String(50), nullable=True),
        sa.Column('form_name', sa.String(255), nullable=True),
        sa.Column('version', sa.String(50), nullable=True),
        sa.Column('page_count', sa.Integer, nullable=True),
        sa.Column('original_language', sa.String(10), nullable=True),
        sa.Column('signature_required', sa.Boolean, default=False),
        sa.Column('signed_date', sa.Date, nullable=True),
        sa.Column('confidentiality_level', sa.String(50), default='HIGH', index=True),
        sa.Column('retention_category', sa.String(100), nullable=True),
        sa.Column('document_metadata', postgresql.JSONB, nullable=True),
    )

    # === EQUIPMENT (inherits from stored_items) ===
    op.create_table(
        'equipment',
        sa.Column('id', postgresql.UUID(as_uuid=True), sa.ForeignKey('stored_items.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('equipment_type', sa.String(100), nullable=False, index=True),
        sa.Column('manufacturer', sa.String(255), nullable=True),
        sa.Column('model', sa.String(255), nullable=True),
        sa.Column('serial_number', sa.String(255), nullable=True, index=True),
        sa.Column('calibration_required', sa.Boolean, default=False),
        sa.Column('last_calibration_date', sa.Date, nullable=True),
        sa.Column('next_calibration_date', sa.Date, nullable=True, index=True),
        sa.Column('maintenance_schedule', sa.String(100), nullable=True),
        sa.Column('last_maintenance_date', sa.Date, nullable=True),
        sa.Column('warranty_expiry_date', sa.Date, nullable=True),
        sa.Column('purchase_date', sa.Date, nullable=True),
        sa.Column('purchase_cost', sa.Numeric(10, 2), nullable=True),
        sa.Column('currency', sa.String(10), default='EUR'),
        sa.Column('operational_status', sa.String(50), default='OPERATIONAL', index=True),
        sa.Column('equipment_metadata', postgresql.JSONB, nullable=True),
    )

    # === CONSUMABLES (inherits from stored_items) ===
    op.create_table(
        'consumables',
        sa.Column('id', postgresql.UUID(as_uuid=True), sa.ForeignKey('stored_items.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('consumable_type', sa.String(100), nullable=False, index=True),
        sa.Column('manufacturer', sa.String(255), nullable=True),
        sa.Column('catalog_number', sa.String(255), nullable=True),
        sa.Column('lot_number', sa.String(255), nullable=True, index=True),
        sa.Column('expiry_date', sa.Date, nullable=True, index=True),
        sa.Column('storage_conditions', sa.String(255), nullable=True),
        sa.Column('hazardous', sa.Boolean, default=False, index=True),
        sa.Column('hazard_classification', sa.String(255), nullable=True),
        sa.Column('minimum_stock_level', sa.Integer, nullable=True),
        sa.Column('reorder_point', sa.Integer, nullable=True),
        sa.Column('consumable_metadata', postgresql.JSONB, nullable=True),
    )

    # === RFID_TAGS ===
    op.create_table(
        'rfid_tags',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('epc', sa.String(255), unique=True, nullable=False, index=True),
        sa.Column('tid', sa.String(255), unique=True, nullable=True, index=True),
        sa.Column('tag_type', sa.String(50), default='UHF_GEN2'),
        sa.Column('user_memory', sa.Text, nullable=True),
        sa.Column('encoding_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('last_read_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('read_count', sa.Integer, default=0, nullable=False),
        sa.Column('status', sa.String(50), default='ACTIVE', nullable=False, index=True),
        sa.Column('associated_item_id', postgresql.UUID(as_uuid=True), nullable=True, index=True),
        sa.Column('associated_item_type', sa.String(50), nullable=True),
        sa.Column('meta_data', postgresql.JSONB, nullable=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )

    # === MOVEMENTS ===
    op.create_table(
        'movements',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('stored_item_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('stored_items.id', ondelete='RESTRICT'), nullable=False, index=True),
        sa.Column('from_container_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('containers.id', ondelete='SET NULL'), nullable=True),
        sa.Column('to_container_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('containers.id', ondelete='SET NULL'), nullable=True),
        sa.Column('from_location_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('storage_locations.id', ondelete='SET NULL'), nullable=True),
        sa.Column('to_location_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('storage_locations.id', ondelete='SET NULL'), nullable=True),
        sa.Column('performed_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='RESTRICT'), nullable=False, index=True),
        sa.Column('approved_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('related_access_request_id', postgresql.UUID(as_uuid=True), nullable=True, index=True),
        sa.Column('movement_type', sa.String(50), nullable=False, index=True),
        sa.Column('quantity', sa.Integer, default=1, nullable=False),
        sa.Column('reason', sa.String(255), nullable=True),
        sa.Column('expected_return_date', sa.Date, nullable=True),
        sa.Column('actual_return_date', sa.Date, nullable=True),
        sa.Column('movement_date', sa.DateTime(timezone=True), nullable=False, index=True),
        sa.Column('notes', sa.Text, nullable=True),
        sa.Column('meta_data', postgresql.JSONB, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )

    # === ACCESS_REQUESTS ===
    op.create_table(
        'access_requests',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('request_number', sa.String(100), unique=True, nullable=False, index=True),
        sa.Column('stored_item_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('stored_items.id', ondelete='RESTRICT'), nullable=False, index=True),
        sa.Column('requester_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='RESTRICT'), nullable=False, index=True),
        sa.Column('requester_site_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('sites.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('reviewed_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('request_type', sa.String(50), default='CONSULTATION', nullable=False),
        sa.Column('purpose', sa.Text, nullable=False),
        sa.Column('urgency', sa.String(50), default='NORMAL', nullable=False),
        sa.Column('status', sa.String(50), default='PENDING', nullable=False, index=True),
        sa.Column('requested_at', sa.DateTime(timezone=True), nullable=False, index=True),
        sa.Column('required_by_date', sa.Date, nullable=True),
        sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('review_notes', sa.Text, nullable=True),
        sa.Column('approved_duration_days', sa.Integer, nullable=True),
        sa.Column('actual_access_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('expected_return_date', sa.Date, nullable=True),
        sa.Column('actual_return_date', sa.Date, nullable=True),
        sa.Column('extension_requested', sa.Boolean, default=False),
        sa.Column('extension_approved', sa.Boolean, nullable=True),
        sa.Column('extension_days', sa.Integer, nullable=True),
        sa.Column('meta_data', postgresql.JSONB, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )

    # === NOTIFICATIONS ===
    op.create_table(
        'notifications',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('notification_type', sa.String(50), nullable=False, index=True),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('message', sa.Text, nullable=False),
        sa.Column('priority', sa.String(50), default='NORMAL', nullable=False),
        sa.Column('channel', sa.String(50), default='IN_APP', nullable=False),
        sa.Column('related_entity_type', sa.String(50), nullable=True),
        sa.Column('related_entity_id', postgresql.UUID(as_uuid=True), nullable=True, index=True),
        sa.Column('is_read', sa.Boolean, default=False, index=True),
        sa.Column('read_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('sent_at', sa.DateTime(timezone=True), nullable=False, index=True),
        sa.Column('meta_data', postgresql.JSONB, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )

    # === AUDIT_TRAIL ===
    op.create_table(
        'audit_trail',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('event_type', sa.String(50), nullable=False, index=True),
        sa.Column('table_name', sa.String(100), nullable=True),
        sa.Column('record_id', postgresql.UUID(as_uuid=True), nullable=True, index=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True),
        sa.Column('username', sa.String(100), nullable=True),
        sa.Column('user_full_name', sa.String(255), nullable=True),
        sa.Column('action', sa.String(255), nullable=False),
        sa.Column('old_values', postgresql.JSONB, nullable=True),
        sa.Column('new_values', postgresql.JSONB, nullable=True),
        sa.Column('ip_address', postgresql.INET, nullable=True),
        sa.Column('user_agent', sa.Text, nullable=True),
        sa.Column('site_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('sites.id', ondelete='SET NULL'), nullable=True),
        sa.Column('session_id', sa.String(255), nullable=True),
        sa.Column('reason', sa.Text, nullable=True),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False, index=True),
        sa.Column('hash_previous', sa.String(64), nullable=True),
        sa.Column('hash_current', sa.String(64), nullable=False),
        sa.Column('meta_data', postgresql.JSONB, nullable=True),
    )

    # === SYSTEM_SETTINGS ===
    op.create_table(
        'system_settings',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('category', sa.String(100), nullable=False, index=True),
        sa.Column('setting_key', sa.String(255), nullable=False, index=True),
        sa.Column('setting_value', sa.Text, nullable=True),
        sa.Column('data_type', sa.String(50), default='STRING', nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('is_sensitive', sa.Boolean, default=False),
        sa.Column('is_editable', sa.Boolean, default=True),
        sa.Column('updated_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.UniqueConstraint('category', 'setting_key', name='uq_system_settings_category_key'),
    )

    # === SYNC_QUEUE ===
    op.create_table(
        'sync_queue',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('site_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('sites.id', ondelete='SET NULL'), nullable=True),
        sa.Column('action_type', sa.String(50), nullable=False),
        sa.Column('table_name', sa.String(100), nullable=False, index=True),
        sa.Column('record_id', postgresql.UUID(as_uuid=True), nullable=True, index=True),
        sa.Column('payload', postgresql.JSONB, nullable=False),
        sa.Column('client_timestamp', sa.DateTime(timezone=True), nullable=False, index=True),
        sa.Column('server_timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.Column('status', sa.String(50), default='PENDING', nullable=False, index=True),
        sa.Column('retry_count', sa.Integer, default=0, nullable=False),
        sa.Column('last_error', sa.Text, nullable=True),
        sa.Column('conflict_resolution', sa.String(50), nullable=True),
        sa.Column('processed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('meta_data', postgresql.JSONB, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )

    # === Create trigger function to prevent UPDATE/DELETE on audit_trail ===
    op.execute("""
        CREATE OR REPLACE FUNCTION prevent_audit_modification()
        RETURNS TRIGGER AS $$
        BEGIN
            RAISE EXCEPTION 'Modification of audit_trail records is not allowed';
            RETURN NULL;
        END;
        $$ LANGUAGE plpgsql;
    """)

    op.execute("""
        CREATE TRIGGER tr_audit_trail_immutable
        BEFORE UPDATE OR DELETE ON audit_trail
        FOR EACH ROW
        EXECUTE FUNCTION prevent_audit_modification();
    """)


def downgrade() -> None:
    # Drop trigger and function
    op.execute("DROP TRIGGER IF EXISTS tr_audit_trail_immutable ON audit_trail;")
    op.execute("DROP FUNCTION IF EXISTS prevent_audit_modification();")

    # Drop tables in reverse order
    op.drop_table('sync_queue')
    op.drop_table('system_settings')
    op.drop_table('audit_trail')
    op.drop_table('notifications')
    op.drop_table('access_requests')
    op.drop_table('movements')
    op.drop_table('rfid_tags')
    op.drop_table('consumables')
    op.drop_table('equipment')
    op.drop_table('documents')
    op.drop_table('stored_items')
    op.drop_table('containers')
    op.drop_table('storage_locations')
    op.drop_table('site_users')
    op.drop_table('sites')
    op.drop_table('studies')
    op.drop_table('users')
    op.drop_table('roles')
