"""Seed initial data for the Clinical Storage System."""

import asyncio
import sys
from uuid import uuid4

sys.path.insert(0, "/home/skamboule/claude-code/urcn-lims/backend")

from sqlalchemy.ext.asyncio import AsyncSession

from common.database.session import AsyncSessionLocal
from common.models import Role, User, SystemSettings
from common.auth.password import hash_password
from common.utils.logger import get_logger

logger = get_logger(__name__)


# System roles with permissions
SYSTEM_ROLES = [
    {
        "name": "Administrateur Système",
        "code": "ADMIN",
        "description": "Accès complet au système",
        "permissions": {"*": {"create": True, "read": True, "update": True, "delete": True}},
        "is_system_role": True,
    },
    {
        "name": "Investigateur Principal",
        "code": "INVESTIGATOR",
        "description": "Responsable étude sur site",
        "permissions": {
            "studies": {"read": True},
            "sites": {"read": True},
            "documents": {"read": True},
            "equipment": {"read": True},
            "access_requests": {"create": True, "read": True},
        },
        "is_system_role": True,
    },
    {
        "name": "Attaché de Recherche Clinique",
        "code": "ARC",
        "description": "Gestion opérationnelle des études",
        "permissions": {
            "studies": {"read": True, "update": True},
            "sites": {"read": True, "update": True},
            "documents": {"create": True, "read": True, "update": True},
            "equipment": {"create": True, "read": True, "update": True},
            "access_requests": {"create": True, "read": True, "update": True},
        },
        "is_system_role": True,
    },
    {
        "name": "Moniteur",
        "code": "MONITOR",
        "description": "Vérification conformité",
        "permissions": {
            "studies": {"read": True},
            "sites": {"read": True},
            "documents": {"read": True},
            "equipment": {"read": True},
            "access_requests": {"create": True, "read": True},
        },
        "is_system_role": True,
    },
    {
        "name": "Archiviste",
        "code": "ARCHIVIST",
        "description": "Gestion physique de l'entreposage",
        "permissions": {
            "documents": {"create": True, "read": True, "update": True},
            "equipment": {"create": True, "read": True, "update": True},
            "consumables": {"create": True, "read": True, "update": True},
            "containers": {"create": True, "read": True, "update": True},
            "movements": {"create": True, "read": True},
            "access_requests": {"read": True, "approve": True, "fulfill": True},
            "rfid": {"read": True, "create": True},
        },
        "is_system_role": True,
    },
    {
        "name": "Data Manager",
        "code": "DATA_MANAGER",
        "description": "Gestion des données et rapports",
        "permissions": {
            "studies": {"read": True},
            "sites": {"read": True},
            "documents": {"read": True},
            "reports": {"create": True, "read": True},
            "exports": {"create": True},
            "audit": {"read": True},
        },
        "is_system_role": True,
    },
    {
        "name": "Data Clerk",
        "code": "DATA_CLERK",
        "description": "Saisie des données",
        "permissions": {
            "documents": {"create": True, "read": True},
            "equipment": {"create": True, "read": True},
            "consumables": {"create": True, "read": True},
        },
        "is_system_role": True,
    },
]

# System settings
SYSTEM_SETTINGS = [
    # Security
    ("SECURITY", "password_min_length", "12", "INTEGER", "Longueur minimale du mot de passe"),
    ("SECURITY", "password_require_special", "true", "BOOLEAN", "Caractère spécial requis"),
    ("SECURITY", "session_timeout_minutes", "30", "INTEGER", "Timeout session inactivité"),
    ("SECURITY", "max_login_attempts", "5", "INTEGER", "Tentatives login avant verrouillage"),
    ("SECURITY", "lockout_duration_minutes", "30", "INTEGER", "Durée verrouillage compte"),
    # Notifications
    ("NOTIFICATIONS", "approval_reminder_hours", "24", "INTEGER", "Rappel approbation si pas de réponse"),
    ("NOTIFICATIONS", "return_reminder_days", "2", "INTEGER", "Rappel retour avant échéance"),
    ("NOTIFICATIONS", "overdue_alert_hours", "12", "INTEGER", "Alerte retard après échéance"),
    # Workflow
    ("WORKFLOW", "default_approval_duration_days", "7", "INTEGER", "Durée accès par défaut"),
    ("WORKFLOW", "max_extension_days", "7", "INTEGER", "Prolongation max autorisée"),
    ("WORKFLOW", "auto_close_fulfilled_days", "30", "INTEGER", "Clôture auto demandes accomplies"),
    # RFID
    ("RFID", "reader_timeout_seconds", "5", "INTEGER", "Timeout lecture tag"),
    ("RFID", "retry_failed_reads", "3", "INTEGER", "Tentatives relecture si échec"),
    # Storage
    ("STORAGE", "capacity_warning_percent", "90", "INTEGER", "Alerte capacité stockage"),
    ("STORAGE", "default_retention_years", "10", "INTEGER", "Rétention par défaut"),
]


async def seed_roles(db: AsyncSession) -> None:
    """Seed system roles."""
    logger.info("Seeding roles...")

    for role_data in SYSTEM_ROLES:
        role = Role(**role_data)
        db.add(role)

    await db.commit()
    logger.info(f"Created {len(SYSTEM_ROLES)} roles")


async def seed_admin_user(db: AsyncSession) -> None:
    """Create initial admin user."""
    logger.info("Creating admin user...")

    admin = User(
        username="admin",
        email="admin@clinical-storage.local",
        password_hash=hash_password("AdminPassword123!"),
        first_name="System",
        last_name="Administrator",
        is_active=True,
        is_superuser=True,
    )
    db.add(admin)
    await db.commit()

    logger.info("Admin user created (username: admin)")


async def seed_system_settings(db: AsyncSession) -> None:
    """Seed system settings."""
    logger.info("Seeding system settings...")

    for category, key, value, data_type, description in SYSTEM_SETTINGS:
        setting = SystemSettings(
            category=category,
            setting_key=key,
            setting_value=value,
            data_type=data_type,
            description=description,
        )
        db.add(setting)

    await db.commit()
    logger.info(f"Created {len(SYSTEM_SETTINGS)} system settings")


async def run_seed() -> None:
    """Run all seed functions."""
    logger.info("Starting database seeding...")

    async with AsyncSessionLocal() as db:
        try:
            await seed_roles(db)
            await seed_admin_user(db)
            await seed_system_settings(db)

            logger.info("Database seeding completed successfully!")
        except Exception as e:
            logger.error(f"Seeding failed: {e}")
            await db.rollback()
            raise


if __name__ == "__main__":
    asyncio.run(run_seed())
