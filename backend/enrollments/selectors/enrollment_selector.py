"""Enrollment selector: complex read queries for Enrollment."""

from __future__ import annotations

from uuid import UUID

import structlog
from django.db.models import QuerySet

from shared.base_selector import BaseSelector
from enrollments.models import Enrollment

logger = structlog.get_logger(__name__)


class EnrollmentSelector(BaseSelector):
    """Read-only queries for Enrollment data."""

    def list_by_class_section(
        self, session_id: UUID, class_id: UUID, section_id: UUID
    ) -> QuerySet[Enrollment]:
        return Enrollment.objects.filter(
            session_id=session_id,
            class_field_id=class_id,
            section_id=section_id,
            status="active",
        ).select_related("student", "session", "class_field", "section")

    def get_active_for_student(self, student_id: UUID, session_id: UUID) -> Enrollment | None:
        try:
            return Enrollment.objects.get(
                student_id=student_id,
                session_id=session_id,
                status="active",
            )
        except Enrollment.DoesNotExist:
            return None
