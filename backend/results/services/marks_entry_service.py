"""MarksEntry service: business logic for marks entry operations."""

from __future__ import annotations

from uuid import UUID

import structlog
from django.db import transaction
from django.db.models import QuerySet

from shared.base_service import BaseService
from shared.exceptions import (
    ConflictException,
    ForbiddenException,
    MarksAuthorizationException,
    MarksValidationException,
    NotFoundException,
)
from results.models import MarksEntry
from results.repositories.marks_entry_repository import MarksEntryRepository

logger = structlog.get_logger(__name__)


class MarksEntryService(BaseService):
    """Handles marks entry CRUD and authorization checks."""

    def __init__(self) -> None:
        self.repo = MarksEntryRepository()

    def enter_marks(
        self,
        enrollment_id: UUID,
        subject_id: UUID,
        assessment_type_id: UUID,
        full_marks: int,
        obtained_marks: int,
        entered_by_id: UUID | None = None,
    ) -> MarksEntry:
        """Create a single marks entry with validation."""
        self._validate_marks(full_marks, obtained_marks)

        existing = self.repo.get_entry(
            enrollment_id=enrollment_id,
            subject_id=subject_id,
            assessment_type_id=assessment_type_id,
        )
        if existing:
            self.log.warning(
                "marks_entry.already_exists",
                enrollment_id=str(enrollment_id),
                subject_id=str(subject_id),
            )
            raise ConflictException(
                "Marks already entered for this enrollment, subject and assessment. "
                "Use update instead."
            )

        self.log.info(
            "marks_entry.creating",
            enrollment_id=str(enrollment_id),
            subject_id=str(subject_id),
        )
        return self.repo.create(
            enrollment_id=enrollment_id,
            subject_id=subject_id,
            assessment_type_id=assessment_type_id,
            full_marks=full_marks,
            obtained_marks=obtained_marks,
            entered_by_id=entered_by_id,
        )

    def update_marks(
        self,
        entry_id: UUID,
        obtained_marks: int,
    ) -> MarksEntry:
        """Update obtained marks for an existing entry."""
        entry = self.repo.get_by_id_or_raise(entry_id, "Marks entry not found.")

        if obtained_marks < 0 or obtained_marks > entry.full_marks:
            self.log.warning(
                "marks_entry.validation_failed",
                entry_id=str(entry_id),
                obtained=obtained_marks,
                full=entry.full_marks,
            )
            raise MarksValidationException(
                f"Obtained marks ({obtained_marks}) must be between 0 and {entry.full_marks}."
            )

        self.log.info("marks_entry.updating", entry_id=str(entry_id))
        updated = self.repo.update(entry_id, obtained_marks=obtained_marks)
        return updated  # type: ignore[return-value]

    @transaction.atomic
    def bulk_upsert(
        self,
        entries: list[dict],
        entered_by_id: UUID,
    ) -> list[MarksEntry]:
        """Bulk create or update marks entries."""
        for entry in entries:
            self._validate_marks(entry["full_marks"], entry["obtained_marks"])
            entry["entered_by_id"] = entered_by_id

        self.log.info("marks_entry.bulk_upsert", count=len(entries))
        return self.repo.bulk_create_or_update(entries)

    def authorize_entry(
        self, user_id: UUID, enrollment_id: UUID, subject_id: UUID
    ) -> tuple[bool, str | None]:
        """Check if a user is authorized to enter marks for this enrollment+subject.

        Admins are always authorized. Teachers must have an active
        TeacherAssignment for the enrollment's class-section-subject-session.
        """
        from core.models import User

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return False, "User not found."

        if user.role == "admin":
            return True, None

        if user.role != "teacher":
            return False, "Only admins and teachers can enter marks."

        from enrollments.models import Enrollment
        from academics.models import TeacherAssignment
        from identity.models import TeacherProfile

        try:
            enrollment = Enrollment.objects.select_related(
                "class_field", "section", "session"
            ).get(id=enrollment_id)
        except Enrollment.DoesNotExist:
            return False, "Enrollment not found."

        try:
            teacher_profile = TeacherProfile.objects.get(user=user)
        except TeacherProfile.DoesNotExist:
            return False, "Teacher profile not found."

        has_assignment = TeacherAssignment.objects.filter(
            teacher=teacher_profile,
            class_ref=enrollment.class_field,
            section=enrollment.section,
            subject_id=subject_id,
            session=enrollment.session,
            is_active=True,
        ).exists()

        if not has_assignment:
            return False, "You are not assigned to teach this subject for this class."

        return True, None

    def get_entries_for_enrollment(self, enrollment_id: UUID) -> QuerySet[MarksEntry]:
        """Return all marks entries for a given enrollment."""
        return self.repo.get_for_enrollment(enrollment_id)

    @staticmethod
    def _validate_marks(full_marks: int, obtained_marks: int) -> None:
        """Validate marks constraints."""
        if full_marks <= 0:
            raise MarksValidationException("Full marks must be greater than zero.")
        if obtained_marks < 0:
            raise MarksValidationException("Obtained marks cannot be negative.")
        if obtained_marks > full_marks:
            raise MarksValidationException(
                f"Obtained marks ({obtained_marks}) cannot exceed full marks ({full_marks})."
            )
