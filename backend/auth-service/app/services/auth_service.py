"""Authentication service."""

from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload


from common.models import User, SiteUser
from common.auth.password import hash_password, verify_password, validate_password_strength
from common.config import get_settings
from common.utils.logger import get_logger, log_security

settings = get_settings()
logger = get_logger(__name__)


class AuthService:
    """Service for authentication operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def authenticate(
        self,
        username: str,
        password: str,
        mfa_code: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> Optional[User]:
        """
        Authenticate a user with username and password.

        Args:
            username: Username or email
            password: Plain text password
            mfa_code: MFA code if required
            ip_address: Client IP address

        Returns:
            User if authentication successful, None otherwise
        """
        # Get user by username or email
        query = (
            select(User)
            .where(
                (User.username == username) | (User.email == username)
            )
            .options(
                selectinload(User.site_users).selectinload(SiteUser.role),
                selectinload(User.site_users).selectinload(SiteUser.site),
            )
        )
        result = await self.db.execute(query)
        user = result.scalar_one_or_none()

        if not user:
            log_security(
                event="LOGIN_FAILED",
                ip_address=ip_address,
                details={"reason": "User not found", "username": username},
            )
            return None

        # Check if account is locked
        if user.is_locked:
            log_security(
                event="LOGIN_FAILED",
                ip_address=ip_address,
                user_id=str(user.id),
                details={"reason": "Account locked"},
            )
            return None

        # Check if user is active
        if not user.is_active:
            log_security(
                event="LOGIN_FAILED",
                ip_address=ip_address,
                user_id=str(user.id),
                details={"reason": "Account inactive"},
            )
            return None

        # Verify password
        if not verify_password(password, user.password_hash):
            await self._handle_failed_login(user.id, ip_address)
            return None

        # Check MFA if enabled
        if user.mfa_enabled:
            if not mfa_code:
                log_security(
                    event="LOGIN_FAILED",
                    ip_address=ip_address,
                    user_id=str(user.id),
                    details={"reason": "MFA code required"},
                )
                return None
            if not self._verify_mfa(user.mfa_secret, mfa_code):
                log_security(
                    event="LOGIN_FAILED",
                    ip_address=ip_address,
                    user_id=str(user.id),
                    details={"reason": "Invalid MFA code"},
                )
                return None

        # Reset failed login attempts on success
        await self._reset_failed_attempts(user.id)

        log_security(
            event="LOGIN_SUCCESS",
            ip_address=ip_address,
            user_id=str(user.id),
        )

        return user

    async def _handle_failed_login(
        self, user_id: UUID, ip_address: Optional[str] = None
    ) -> None:
        """Handle a failed login attempt."""
        # Increment failed attempts
        stmt = (
            update(User)
            .where(User.id == user_id)
            .values(failed_login_attempts=User.failed_login_attempts + 1)
        )
        await self.db.execute(stmt)

        # Check if should lock account
        result = await self.db.execute(
            select(User.failed_login_attempts).where(User.id == user_id)
        )
        attempts = result.scalar_one()

        if attempts >= settings.MAX_LOGIN_ATTEMPTS:
            lockout_until = datetime.now(timezone.utc) + timedelta(
                minutes=settings.LOCKOUT_DURATION_MINUTES
            )
            await self.db.execute(
                update(User)
                .where(User.id == user_id)
                .values(locked_until=lockout_until)
            )
            log_security(
                event="ACCOUNT_LOCKED",
                ip_address=ip_address,
                user_id=str(user_id),
                details={"lockout_until": lockout_until.isoformat()},
            )

        await self.db.commit()

        log_security(
            event="LOGIN_FAILED",
            ip_address=ip_address,
            user_id=str(user_id),
            details={"reason": "Invalid password", "attempts": attempts},
        )

    async def _reset_failed_attempts(self, user_id: UUID) -> None:
        """Reset failed login attempts after successful login."""
        await self.db.execute(
            update(User)
            .where(User.id == user_id)
            .values(failed_login_attempts=0, locked_until=None)
        )
        await self.db.commit()

    async def update_last_login(self, user_id: UUID) -> None:
        """Update user's last login timestamp."""
        await self.db.execute(
            update(User)
            .where(User.id == user_id)
            .values(last_login=datetime.now())
        )
        await self.db.commit()

    async def change_password(
        self,
        user_id: UUID,
        current_password: str,
        new_password: str,
    ) -> bool:
        """
        Change user password.

        Args:
            user_id: User ID
            current_password: Current password
            new_password: New password

        Returns:
            True if password changed successfully
        """
        # Get user
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()

        if not user:
            return False

        # Verify current password
        if not verify_password(current_password, user.password_hash):
            return False

        # Validate new password strength
        is_valid, errors = validate_password_strength(new_password)
        if not is_valid:
            logger.warning(
                "Password change failed: weak password",
                user_id=str(user_id),
                errors=errors,
            )
            return False

        # Update password
        new_hash = hash_password(new_password)
        await self.db.execute(
            update(User)
            .where(User.id == user_id)
            .values(
                password_hash=new_hash,
                password_changed_at=datetime.now(),
            )
        )
        await self.db.commit()

        log_security(
            event="PASSWORD_CHANGED",
            user_id=str(user_id),
        )

        return True

    async def request_password_reset(self, email: str) -> bool:
        """
        Request password reset.
        Sends reset link to email if user exists.
        """
        result = await self.db.execute(
            select(User).where(User.email == email)
        )
        user = result.scalar_one_or_none()

        if not user:
            return False

        # TODO: Generate reset token and send email
        logger.info("Password reset requested", user_id=str(user.id))
        return True

    async def reset_password(self, token: str, new_password: str) -> bool:
        """
        Reset password using reset token.
        """
        # TODO: Implement password reset with token verification
        return False

    def _verify_mfa(self, secret: str, code: str) -> bool:
        """Verify MFA TOTP code."""
        # TODO: Implement TOTP verification
        return False
