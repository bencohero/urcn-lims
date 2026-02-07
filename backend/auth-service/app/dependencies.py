"""Auth service dependencies."""

import sys
sys.path.insert(0, "/home/skamboule/claude-code/urcn-lims/backend")

from common.auth.dependencies import get_current_user, require_permission, require_role
from common.database import get_db

__all__ = [
    "get_current_user",
    "require_permission",
    "require_role",
    "get_db",
]
