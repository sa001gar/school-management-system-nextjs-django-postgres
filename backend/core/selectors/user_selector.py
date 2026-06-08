"""Selectors for User queries."""

from __future__ import annotations

from uuid import UUID

from django.contrib.auth import get_user_model
from django.db.models import QuerySet

from shared.base_selector import BaseSelector

User = get_user_model()


class UserSelector(BaseSelector):
    """Complex read queries for User model."""

    def get_user_by_id(self, user_id: UUID) -> User | None:
        return User.objects.filter(id=user_id).first()

    def list_active_users(self) -> QuerySet[User]:
        return User.objects.filter(is_active=True)

    def list_teachers(self) -> QuerySet[User]:
        return User.objects.filter(role="teacher", is_active=True)

    def list_admins(self) -> QuerySet[User]:
        return User.objects.filter(role="admin", is_active=True)
