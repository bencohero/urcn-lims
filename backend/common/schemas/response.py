"""Standard API response schemas."""

from datetime import datetime
from typing import Any, Generic, List, Optional, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class PaginationMeta(BaseModel):
    """Pagination metadata."""

    page: int = Field(ge=1, description="Current page number")
    page_size: int = Field(ge=1, le=100, description="Items per page")
    total_items: int = Field(ge=0, description="Total number of items")
    total_pages: int = Field(ge=0, description="Total number of pages")


class ErrorDetail(BaseModel):
    """Error detail information."""

    code: str = Field(description="Error code")
    message: str = Field(description="Error message")
    details: Optional[dict] = Field(default=None, description="Additional error details")


class APIResponse(BaseModel, Generic[T]):
    """Standard API response wrapper."""

    success: bool = Field(description="Whether the request was successful")
    data: Optional[T] = Field(default=None, description="Response data")
    message: Optional[str] = Field(default=None, description="Response message")
    timestamp: datetime = Field(
        default_factory=datetime.utcnow, description="Response timestamp"
    )


class ErrorResponse(BaseModel):
    """Error response wrapper."""

    success: bool = Field(default=False, description="Always false for errors")
    error: ErrorDetail = Field(description="Error information")
    timestamp: datetime = Field(
        default_factory=datetime.utcnow, description="Response timestamp"
    )


class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated response wrapper."""

    success: bool = Field(default=True, description="Whether the request was successful")
    data: dict = Field(description="Response data with items and pagination")
    timestamp: datetime = Field(
        default_factory=datetime.utcnow, description="Response timestamp"
    )

    @classmethod
    def create(
        cls,
        items: List[Any],
        page: int,
        page_size: int,
        total_items: int,
    ) -> "PaginatedResponse":
        """Create a paginated response."""
        total_pages = (total_items + page_size - 1) // page_size if page_size > 0 else 0
        return cls(
            data={
                "items": items,
                "pagination": {
                    "page": page,
                    "page_size": page_size,
                    "total_items": total_items,
                    "total_pages": total_pages,
                },
            }
        )
