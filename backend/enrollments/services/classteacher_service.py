"""ClassTeacher service: business logic for class teacher assignments."""

from __future__ import annotations

from uuid import UUID

import structlog
from django.db import transaction

from shared.base_service import BaseService
from shared.exceptions import ConflictException
from enrollments.models import ClassTeacher
from enrollments.repositories.classteacher_repository import ClassTeacherRepository

logger = structlog.get_logger(__name__)


class ClassTeacherService(BaseService):
    """Handles class teacher assignment, removal, and queries."""

    def __init__(self) -> None:
        self.repo = ClassTeacherRepository()

    @transaction.atomic
    def assign(
        self,
        teacher_id: UUID,
        class_id: UUID,
        section_id: UUID,
        session_id: UUID,
    ) -> ClassTeacher:
        existing = self.repo.get_by_class_section_session(class_id, section_id, session_id)
        if existing:
            self.log.warning("duplicate_class_teacher", session_id=session_id)
            raise ConflictException("A class teacher is already assigned for this class-section-session.")
        self.log.info("assigning_class_teacher", teacher_id=teacher_id, session_id=session_id)
        return self.repo.create(
            teacher_id=teacher_id,
            class_field_id=class_id,
            section_id=section_id,
            session_id=session_id,
            is_active=True,
        )

    @transaction.atomic
    def remove(self, class_teacher_id: UUID) -> None:
        obj = self.repo.get_by_id_or_raise(class_teacher_id, "ClassTeacher assignment not found.")
        self.log.info("removing_class_teacher", class_teacher_id=class_teacher_id)
        obj.is_active = False
        obj.save(update_fields=["is_active"])

    def list_for_session(self, session_id: UUID):
        return self.repo.filter(session_id=session_id, is_active=True)

    def is_class_teacher(self, teacher_id: UUID, class_id: UUID, section_id: UUID, session_id: UUID) -> bool:
        return self.repo.filter(
            teacher_id=teacher_id,
            class_field_id=class_id,
            section_id=section_id,
            session_id=session_id,
            is_active=True,
        ).exists()
