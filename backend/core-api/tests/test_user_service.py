"""Tests for UserService."""

import pytest
from uuid import uuid4

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

import sys
sys.path.insert(0, "/home/skamboule/claude-code/urcn-lims/backend")
sys.path.insert(0, "/home/skamboule/claude-code/urcn-lims/backend/core-api")

from common.models import Role, Site, SiteUser, User
from common.schemas.user import UserCreate, UserUpdate
from app.services.user_service import UserService


@pytest.mark.asyncio
class TestUserServiceGetUsers:
    """Tests for UserService.get_users."""

    async def test_get_users_empty(self, db: AsyncSession):
        service = UserService(db)
        users, total = await service.get_users()
        assert total == 0

    async def test_get_users_returns_all(self, db: AsyncSession, admin_user: User):
        service = UserService(db)
        users, total = await service.get_users()
        assert total == 1
        assert users[0].id == admin_user.id

    async def test_get_users_filter_active(self, db: AsyncSession, admin_user: User):
        service = UserService(db)
        users, total = await service.get_users(is_active=True)
        assert total == 1

        users, total = await service.get_users(is_active=False)
        assert total == 0

    async def test_get_users_search(self, db: AsyncSession, admin_user: User):
        service = UserService(db)
        users, total = await service.get_users(search="admin")
        assert total == 1

        users, total = await service.get_users(search="nonexistent")
        assert total == 0

    async def test_get_users_search_by_name(self, db: AsyncSession, admin_user: User):
        service = UserService(db)
        users, total = await service.get_users(search="Admin")
        assert total == 1

    async def test_get_users_pagination(self, db: AsyncSession, admin_user: User, regular_user: User):
        service = UserService(db)
        users, total = await service.get_users(page=1, page_size=1)
        assert total == 2
        assert len(users) == 1


@pytest.mark.asyncio
class TestUserServiceGetById:
    """Tests for UserService.get_user_by_id."""

    async def test_get_user_by_id(self, db: AsyncSession, admin_user: User):
        service = UserService(db)
        result = await service.get_user_by_id(admin_user.id)
        assert result is not None
        assert result.username == "admin"

    async def test_get_user_by_id_not_found(self, db: AsyncSession):
        service = UserService(db)
        result = await service.get_user_by_id(uuid4())
        assert result is None


@pytest.mark.asyncio
class TestUserServiceGetByUsername:
    """Tests for UserService.get_user_by_username."""

    async def test_get_user_by_username(self, db: AsyncSession, admin_user: User):
        service = UserService(db)
        result = await service.get_user_by_username("admin")
        assert result is not None
        assert result.id == admin_user.id

    async def test_get_user_by_username_not_found(self, db: AsyncSession):
        service = UserService(db)
        result = await service.get_user_by_username("ghost")
        assert result is None


@pytest.mark.asyncio
class TestUserServiceCreate:
    """Tests for UserService.create_user."""

    async def test_create_user(self, db: AsyncSession, admin_user: User):
        service = UserService(db)
        data = UserCreate(
            username="newuser",
            email="newuser@example.com",
            password="StrongPassword123!",
            first_name="New",
            last_name="User",
        )
        user = await service.create_user(data, admin_user)
        assert user.id is not None
        assert user.username == "newuser"
        assert user.created_by == admin_user.id
        # Password should be hashed, not stored as plain text
        assert user.password_hash != "StrongPassword123!"

    async def test_create_user_duplicate_username(self, db: AsyncSession, admin_user: User):
        service = UserService(db)
        data = UserCreate(
            username="admin",  # already exists
            email="other@example.com",
            password="StrongPassword123!",
            first_name="Dup",
            last_name="User",
        )
        with pytest.raises(HTTPException) as exc_info:
            await service.create_user(data, admin_user)
        assert exc_info.value.status_code == 409

    async def test_create_user_duplicate_email(self, db: AsyncSession, admin_user: User):
        service = UserService(db)
        data = UserCreate(
            username="uniqueuser",
            email="admin@example.com",  # already exists
            password="StrongPassword123!",
            first_name="Dup",
            last_name="User",
        )
        with pytest.raises(HTTPException) as exc_info:
            await service.create_user(data, admin_user)
        assert exc_info.value.status_code == 409

    async def test_create_user_weak_password(self, db: AsyncSession, admin_user: User):
        service = UserService(db)
        data = UserCreate(
            username="weakuser",
            email="weak@example.com",
            password="weakpassword1",  # no uppercase, no special char
            first_name="Weak",
            last_name="User",
        )
        with pytest.raises(HTTPException) as exc_info:
            await service.create_user(data, admin_user)
        assert exc_info.value.status_code == 400


@pytest.mark.asyncio
class TestUserServiceUpdate:
    """Tests for UserService.update_user."""

    async def test_update_user(self, db: AsyncSession, admin_user: User, regular_user: User):
        service = UserService(db)
        data = UserUpdate(first_name="Jane", last_name="Smith")
        result = await service.update_user(regular_user.id, data, admin_user)
        assert result is not None
        assert result.first_name == "Jane"
        assert result.last_name == "Smith"

    async def test_update_user_not_found(self, db: AsyncSession, admin_user: User):
        service = UserService(db)
        data = UserUpdate(first_name="Ghost")
        result = await service.update_user(uuid4(), data, admin_user)
        assert result is None

    async def test_update_user_duplicate_email(
        self, db: AsyncSession, admin_user: User, regular_user: User
    ):
        service = UserService(db)
        data = UserUpdate(email="admin@example.com")  # admin_user's email
        with pytest.raises(HTTPException) as exc_info:
            await service.update_user(regular_user.id, data, admin_user)
        assert exc_info.value.status_code == 409


@pytest.mark.asyncio
class TestUserServiceDeactivate:
    """Tests for UserService.deactivate_user."""

    async def test_deactivate_user(self, db: AsyncSession, admin_user: User, regular_user: User):
        service = UserService(db)
        result = await service.deactivate_user(regular_user.id, admin_user)
        assert result is not None
        assert result.is_active is False

    async def test_deactivate_user_not_found(self, db: AsyncSession, admin_user: User):
        service = UserService(db)
        result = await service.deactivate_user(uuid4(), admin_user)
        assert result is None


@pytest.mark.asyncio
class TestUserServiceSiteRoles:
    """Tests for UserService.assign_site_role / unassign_site_role."""

    async def test_assign_site_role(
        self, db: AsyncSession, admin_user: User, regular_user: User, site: Site, investigator_role: Role
    ):
        service = UserService(db)
        su = await service.assign_site_role(
            user_id=regular_user.id,
            site_id=site.id,
            role_id=investigator_role.id,
            current_user=admin_user,
        )
        assert su.id is not None
        assert su.user_id == regular_user.id
        assert su.site_id == site.id

    async def test_assign_site_role_duplicate(
        self, db: AsyncSession, admin_user: User, regular_user: User,
        site: Site, investigator_role: Role, site_user_assignment: SiteUser
    ):
        service = UserService(db)
        with pytest.raises(HTTPException) as exc_info:
            await service.assign_site_role(
                user_id=regular_user.id,
                site_id=site.id,
                role_id=investigator_role.id,
                current_user=admin_user,
            )
        assert exc_info.value.status_code == 409

    async def test_assign_site_role_user_not_found(
        self, db: AsyncSession, admin_user: User, site: Site, investigator_role: Role
    ):
        service = UserService(db)
        with pytest.raises(HTTPException) as exc_info:
            await service.assign_site_role(
                user_id=uuid4(),
                site_id=site.id,
                role_id=investigator_role.id,
                current_user=admin_user,
            )
        assert exc_info.value.status_code == 404

    async def test_unassign_site_role(
        self, db: AsyncSession, admin_user: User, regular_user: User,
        site: Site, investigator_role: Role, site_user_assignment: SiteUser
    ):
        service = UserService(db)
        result = await service.unassign_site_role(
            user_id=regular_user.id,
            site_id=site.id,
            role_id=investigator_role.id,
            current_user=admin_user,
        )
        assert result is not None
        assert result.unassigned_at is not None

    async def test_unassign_site_role_not_found(
        self, db: AsyncSession, admin_user: User, regular_user: User,
        site: Site, investigator_role: Role
    ):
        service = UserService(db)
        result = await service.unassign_site_role(
            user_id=regular_user.id,
            site_id=site.id,
            role_id=investigator_role.id,
            current_user=admin_user,
        )
        assert result is None
