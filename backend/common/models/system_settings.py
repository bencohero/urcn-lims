"""
SystemSettings model for application configuration.
"""

import uuid
from typing import Any, Optional

from sqlalchemy import Boolean, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from .base import BaseModel


class SystemSettings(BaseModel):
    """System configuration settings."""

    __tablename__ = "system_settings"
    __table_args__ = (
        UniqueConstraint(
            "category", "setting_key", name="uq_system_settings_category_key"
        ),
    )

    # Category: GENERAL, SECURITY, NOTIFICATIONS, RFID, WORKFLOW, STORAGE
    category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)

    # Setting key
    setting_key: Mapped[str] = mapped_column(String(255), nullable=False, index=True)

    # Setting value (stored as text, parsed based on data_type)
    setting_value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Data type: STRING, INTEGER, BOOLEAN, JSON, FLOAT
    data_type: Mapped[str] = mapped_column(String(50), default="STRING", nullable=False)

    # Description
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Security
    is_sensitive: Mapped[bool] = mapped_column(
        Boolean, default=False
    )  # Should be encrypted
    is_editable: Mapped[bool] = mapped_column(Boolean, default=True)

    # Audit
    updated_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    def get_value(self) -> Any:
        """Get parsed value based on data type."""
        if self.setting_value is None:
            return None

        if self.data_type == "INTEGER":
            return int(self.setting_value)
        elif self.data_type == "FLOAT":
            return float(self.setting_value)
        elif self.data_type == "BOOLEAN":
            return self.setting_value.lower() in ("true", "1", "yes")
        elif self.data_type == "JSON":
            import json

            return json.loads(self.setting_value)
        else:
            return self.setting_value

    def set_value(self, value: Any) -> None:
        """Set value and convert to string."""
        if value is None:
            self.setting_value = None
        elif self.data_type == "JSON":
            import json

            self.setting_value = json.dumps(value)
        elif self.data_type == "BOOLEAN":
            self.setting_value = "true" if value else "false"
        else:
            self.setting_value = str(value)

    def __repr__(self) -> str:
        return f"<SystemSettings(category={self.category}, key={self.setting_key})>"
