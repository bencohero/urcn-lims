"""User service."""

from datetime import datetime, timezone
from typing import List, Optional, Tuple
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload


from common.models import User, SiteUser, Role
from common.schemas.user import UserCreate, UserUpdate
from common.auth.password import hash_password, validate_password_strength

from .audit_service import AuditService


class UserService:
    """Service for user management operations."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.audit_service = AuditService(db)

    async def get_users(
        self,
        is_active: Optional[bool] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 50,
    ) -> Tuple[List[User], int]:
        """Get users with filters and pagination."""
        query = select(User).options(
            selectinload(User.site_users).selectinload(SiteUser.site),
            selectinload(User.site_users).selectinload(SiteUser.role),
        )

        filters = []
        if is_active is not None:
            filters.append(User.is_active == is_active)
        if search:
            filters.append(
                or_(
                    User.username.ilike(f"%{search}%"),
                    User.email.ilike(f"%{search}%"),
                    User.first_name.ilike(f"%{search}%"),
                    User.last_name.ilike(f"%{search}%"),
                )
            )

        if filters:
            query = query.where(and_(*filters))

        # Count
        count_query = select(func.count()).select_from(User)
        if filters:
            count_query = count_query.where(and_(*filters))
        total_result = await self.db.execute(count_query)
        total = total_result.scalar()

        # Pagination
        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size).order_by(
            User.last_name.asc(), User.first_name.asc()
        )

        result = await self.db.execute(query)
        users = result.scalars().all()

        return users, total

    async def get_user_by_id(self, user_id: UUID) -> Optional[User]:
        """Get user by ID with site and role details."""
        query = (
            select(User)
            .where(User.id == user_id)
            .options(
                selectinload(User.site_users).selectinload(SiteUser.site),
                selectinload(User.site_users).selectinload(SiteUser.role),
            )
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_user_by_username(self, username: str) -> Optional[User]:
        """Get user by username."""
        query = select(User).where(User.username == username)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email."""
        query = select(User).where(User.email == email)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def create_user(
        self, user_data: UserCreate, current_user: User
    ) -> User:
        """Create a new user."""
        # Check username uniqueness
        existing = await self.get_user_by_username(user_data.username)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username already exists",
            )

        # Check email uniqueness
        existing = await self.get_user_by_email(user_data.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already exists",
            )

        # Validate password strength
        is_valid, errors = validate_password_strength(user_data.password)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"message": "Password does not meet requirements", "errors": errors},
            )

        user = User(
            username=user_data.username,
            email=user_data.email,
            password_hash=hash_password(user_data.password),
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            phone=user_data.phone,
            is_active=user_data.is_active,
            is_superuser=user_data.is_superuser,
            password_changed_at=datetime.now(timezone.utc),
            created_by=current_user.id,
        )
        self.db.add(user)

        await self.audit_service.log_action(
            event_type="CREATE",
            table_name="users",
            record_id=user.id,
            user_id=current_user.id,
            new_values={
                "username": user_data.username,
                "email": user_data.email,
                "first_name": user_data.first_name,
                "last_name": user_data.last_name,
                "is_active": user_data.is_active,
                "is_superuser": user_data.is_superuser,
            },
        )

        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def update_user(
        self, user_id: UUID, user_data: UserUpdate, current_user: User
    ) -> Optional[User]:
        """Update a user."""
        user = await self.get_user_by_id(user_id)
        if not user:
            return None

        update_data = user_data.model_dump(exclude_unset=True)

        # Check email uniqueness if changing email
        if "email" in update_data and update_data["email"] != user.email:
            existing = await self.get_user_by_email(update_data["email"])
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Email already exists",
                )

        old_values = {}
        for key in update_data.keys():
            old_values[key] = getattr(user, key, None)

        for key, value in update_data.items():
            setattr(user, key, value)

        user.updated_by = current_user.id

        await self.audit_service.log_action(
            event_type="UPDATE",
            table_name="users",
            record_id=user.id,
            user_id=current_user.id,
            old_values=old_values,
            new_values=update_data,
        )

        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def deactivate_user(
        self, user_id: UUID, current_user: User
    ) -> Optional[User]:
        """Deactivate a user (soft disable)."""
        user = await self.get_user_by_id(user_id)
        if not user:
            return None

        user.is_active = False
        user.updated_by = current_user.id

        await self.audit_service.log_action(
            event_type="UPDATE",
            table_name="users",
            record_id=user.id,
            user_id=current_user.id,
            old_values={"is_active": True},
            new_values={"is_active": False},
            action="User deactivated",
        )

        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def assign_site_role(
        self,
        user_id: UUID,
        site_id: UUID,
        role_id: UUID,
        current_user: User,
        is_primary: bool = False,
    ) -> SiteUser:
        """Assign a user to a site with a role."""
        # Verify user exists
        user = await self.get_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        # Check for existing active assignment
        query = select(SiteUser).where(
            and_(
                SiteUser.user_id == user_id,
                SiteUser.site_id == site_id,
                SiteUser.role_id == role_id,
                SiteUser.unassigned_at.is_(None),
            )
        )
        result = await self.db.execute(query)
        existing = result.scalar_one_or_none()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User already has this role on this site",
            )

        site_user = SiteUser(
            user_id=user_id,
            site_id=site_id,
            role_id=role_id,
            is_primary=is_primary,
            assigned_at=datetime.now(timezone.utc),
            created_by=current_user.id,
        )
        self.db.add(site_user)

        await self.audit_service.log_action(
            event_type="CREATE",
            table_name="site_users",
            record_id=site_user.id,
            user_id=current_user.id,
            new_values={
                "user_id": str(user_id),
                "site_id": str(site_id),
                "role_id": str(role_id),
                "is_primary": is_primary,
            },
            action="User assigned to site with role",
        )

        await self.db.commit()
        await self.db.refresh(site_user)
        return site_user

    async def unassign_site_role(
        self,
        user_id: UUID,
        site_id: UUID,
        role_id: UUID,
        current_user: User,
    ) -> Optional[SiteUser]:
        """Remove a user's role assignment from a site."""
        query = select(SiteUser).where(
            and_(
                SiteUser.user_id == user_id,
                SiteUser.site_id == site_id,
                SiteUser.role_id == role_id,
                SiteUser.unassigned_at.is_(None),
            )
        )
        result = await self.db.execute(query)
        site_user = result.scalar_one_or_none()

        if not site_user:
            return None

        site_user.unassigned_at = datetime.now(timezone.utc)

        await self.audit_service.log_action(
            event_type="UPDATE",
            table_name="site_users",
            record_id=site_user.id,
            user_id=current_user.id,
            old_values={"unassigned_at": None},
            new_values={"unassigned_at": site_user.unassigned_at.isoformat()},
            action="User unassigned from site role",
        )

        await self.db.commit()
        await self.db.refresh(site_user)
        return site_user
