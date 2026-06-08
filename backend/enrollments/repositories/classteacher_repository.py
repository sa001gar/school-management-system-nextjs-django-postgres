"""ClassTeacher repository: data access for ClassTeacher model."""

from __future__ import annotations

from uuid import UUID

from shared.base_repository import BaseRepository
from enrollments.models import ClassTeacher


class ClassTeacherRepository(BaseRepository[ClassTeacher]):
    """Repository for ClassTeacher data access."""

    model = ClassTeacher

    def get_by_class_section_session(
        self, class_id: UUID, section_id: UUID, session_id: UUID
    ) -> ClassTeacher | None:
        try:
            return self.model.objects.get(
                class_field_id=class_id,
                section_id=section_id,
                session_id=session_id,
                is_active=True,
            )
        except self.model.DoesNotExist:
            return None
