"""Repository for User model operations."""

from __future__ import annotations

from typing import Type
from uuid import UUID

from django.contrib.auth import get_user_model
from django.db.models import QuerySet

from shared.base_repository import BaseRepository

User = get_user_model()


class UserRepository(BaseRepository):
    """Persistence operations for User model."""

    model = User

    def get_by_email(self, email: str) -> User | None:
        try:
            return User.objects.get(email=email)
        except User.DoesNotExist:
            return None

    def list_by_role(self, role: str) -> QuerySet[User]:
        return User.objects.filter(role=role)

    def create_user(self, email: str, password: str, role: str, **kwargs) -> User:
        user = User.objects.create_user(
            email=email,
            password=password,
            role=role,
            **kwargs,
        )
        return user
