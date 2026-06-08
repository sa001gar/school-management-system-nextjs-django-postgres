"""Student selector: complex read queries for Student."""

from __future__ import annotations

from uuid import UUID

import structlog
from django.db.models import QuerySet, Prefetch

from shared.base_selector import BaseSelector
from enrollments.models import Student, Enrollment

logger = structlog.get_logger(__name__)


class StudentSelector(BaseSelector):
    """Read-only queries for Student data."""

    def list_active(self) -> QuerySet[Student]:
        return Student.objects.filter(is_active=True)

    def search(self, query: str) -> QuerySet[Student]:
        return Student.objects.filter(
            name__icontains=query,
            is_active=True,
        )

    def get_with_enrollment(self, student_id: UUID) -> Student | None:
        try:
            return Student.objects.prefetch_related(
                Prefetch(
                    "enrollments",
                    queryset=Enrollment.objects.select_related("session", "class_field", "section"),
                )
            ).get(id=student_id)
        except Student.DoesNotExist:
            return None
