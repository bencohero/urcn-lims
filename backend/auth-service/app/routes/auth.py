"""Authentication routes."""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession


from common.database import get_db
from common.models import User
from common.schemas.user import (
    ChangePasswordRequest,
    LoginResponse,
    RefreshTokenRequest,
    UserLogin,
    UserResponse,
)
from common.schemas.response import APIResponse
from common.auth.dependencies import get_current_user
from common.auth.jwt import create_access_token, create_refresh_token, verify_token
from common.config import get_settings

from ..services.auth_service import AuthService
from ..services.token_service import TokenService

router = APIRouter()
settings = get_settings()


@router.post("/login", response_model=APIResponse[LoginResponse])
async def login(
    login_data: UserLogin,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Authenticate user and return access/refresh tokens.
    """
    auth_service = AuthService(db)

    user = await auth_service.authenticate(
        username=login_data.username,
        password=login_data.password,
        mfa_code=login_data.mfa_code,
        ip_address=request.client.host if request.client else None,
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    # Generate tokens
    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    # Update last login
    await auth_service.update_last_login(user.id)

    # Build user response
    user_response = UserResponse.model_validate(user)

    return APIResponse(
        success=True,
        data=LoginResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="Bearer",
            expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=user_response,
        ),
        message="Login successful",
    )


@router.post("/refresh", response_model=APIResponse)
async def refresh_token(
    refresh_data: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Refresh access token using refresh token.
    """
    token_service = TokenService(db)

    user_id = verify_token(refresh_data.refresh_token, token_type="refresh")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    # Verify user still exists and is active
    user = await token_service.get_user_by_id(user_id)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    # Generate new access token
    access_token = create_access_token(user_id)

    return APIResponse(
        success=True,
        data={
            "access_token": access_token,
            "expires_in": settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        },
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Logout user and invalidate tokens.
    """
    token_service = TokenService(db)
    await token_service.invalidate_user_tokens(current_user.id)
    return None


@router.get("/me", response_model=APIResponse[UserResponse])
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
):
    """
    Get current authenticated user information.
    """
    user_response = UserResponse.model_validate(current_user)
    return APIResponse(
        success=True,
        data=user_response,
    )


@router.put("/change-password", response_model=APIResponse)
async def change_password(
    password_data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Change user password.
    """
    if password_data.new_password != password_data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password and confirmation do not match",
        )

    auth_service = AuthService(db)

    success = await auth_service.change_password(
        user_id=current_user.id,
        current_password=password_data.current_password,
        new_password=password_data.new_password,
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    return APIResponse(
        success=True,
        message="Password changed successfully",
    )


@router.post("/forgot-password", response_model=APIResponse)
async def forgot_password(
    email: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Request password reset email.
    """
    auth_service = AuthService(db)
    await auth_service.request_password_reset(email)

    # Always return success to prevent email enumeration
    return APIResponse(
        success=True,
        message="If the email exists, a password reset link has been sent",
    )


@router.post("/reset-password", response_model=APIResponse)
async def reset_password(
    token: str,
    new_password: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Reset password using reset token.
    """
    auth_service = AuthService(db)

    success = await auth_service.reset_password(
        token=token,
        new_password=new_password,
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )

    return APIResponse(
        success=True,
        message="Password reset successfully",
    )
