"""Auth service dependencies."""


from common.auth.dependencies import (
    get_current_user,
    require_permission,
    require_role,
)
from common.database import get_db, get_redis

__all__ = [
    "get_current_user",
    "require_permission",
    "require_role",
    "get_db",
    "get_redis",
]
