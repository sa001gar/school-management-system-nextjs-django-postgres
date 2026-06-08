"""Selectors for Class queries."""

from __future__ import annotations

from uuid import UUID

from django.db.models import QuerySet

from academics.models import Class
from shared.base_selector import BaseSelector


class ClassSelector(BaseSelector):
    """Read-only queries for classes."""

    def list_ordered(self) -> QuerySet[Class]:
        return Class.objects.all().order_by("level")

    def get_with_sections(self, class_id: UUID) -> Class | None:
        return (
            Class.objects.filter(id=class_id)
            .prefetch_related("sections")
            .first()
        )
