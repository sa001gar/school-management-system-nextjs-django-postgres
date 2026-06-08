"""Enrollment repository: data access for Enrollment model."""

from __future__ import annotations

from uuid import UUID

from django.db.models import QuerySet

from shared.base_repository import BaseRepository
from enrollments.models import Enrollment


class EnrollmentRepository(BaseRepository[Enrollment]):
    """Repository for Enrollment data access."""

    model = Enrollment

    def get_active(self, student_id: UUID, session_id: UUID) -> Enrollment | None:
        try:
            return self.model.objects.get(
                student_id=student_id,
                session_id=session_id,
                status="active",
            )
        except self.model.DoesNotExist:
            return None

    def get_class_enrollments(
        self, session_id: UUID, class_id: UUID, section_id: UUID
    ) -> QuerySet[Enrollment]:
        return self.model.objects.filter(
            session_id=session_id,
            class_field_id=class_id,
            section_id=section_id,
            status="active",
        )

    def get_by_student_and_session(self, student_id: UUID, session_id: UUID) -> Enrollment | None:
        try:
            return self.model.objects.get(student_id=student_id, session_id=session_id)
        except self.model.DoesNotExist:
            return None
