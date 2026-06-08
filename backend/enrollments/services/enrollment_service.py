"""Enrollment service: business logic for enrollment and promotion."""

from __future__ import annotations

from uuid import UUID
from typing import Any

import structlog
from django.db import transaction

from shared.base_service import BaseService
from shared.exceptions import ConflictException, NotFoundException
from core.models_audit import AuditLog
from enrollments.models import Enrollment
from enrollments.repositories.enrollment_repository import EnrollmentRepository

logger = structlog.get_logger(__name__)


class EnrollmentService(BaseService):
    """Handles enrollment, promotion, retention, transfer, and bulk operations."""

    def __init__(self) -> None:
        self.repo = EnrollmentRepository()

    @transaction.atomic
    def enroll(
        self,
        student_id: UUID,
        session_id: UUID,
        class_id: UUID,
        section_id: UUID,
        roll_no: str = "",
        **kwargs,
    ) -> Enrollment:
        if self.repo.exists(student_id=student_id, session_id=session_id):
            self.log.warning("duplicate_enrollment", student_id=student_id, session_id=session_id)
            raise ConflictException("Student is already enrolled in this session.")
        self.log.info("enrolling_student", student_id=student_id, session_id=session_id)
        enrollment = self.repo.create(
            student_id=student_id,
            session_id=session_id,
            class_field_id=class_id,
            section_id=section_id,
            roll_no=roll_no,
            status="active",
            **kwargs,
        )
        AuditLog.log(
            action="student_created",
            entity_type="Enrollment",
            entity_id=str(enrollment.id),
            details={
                "student_id": str(student_id),
                "session_id": str(session_id),
                "class_id": str(class_id),
                "section_id": str(section_id),
                "roll_no": roll_no,
            },
        )
        return enrollment

    @transaction.atomic
    def promote(
        self,
        enrollment_id: UUID,
        new_class_id: UUID,
        new_section_id: UUID,
        new_session_id: UUID,
        new_roll_no: str = "",
    ) -> Enrollment:
        enrollment = self.repo.get_by_id_or_raise(enrollment_id, "Enrollment not found.")
        self.log.info("promoting_enrollment", enrollment_id=enrollment_id)
        promoted = enrollment.promote_to_next_class(
            new_class_id, new_section_id, new_session_id, new_roll_no
        )
        AuditLog.log(
            action="student_promoted",
            entity_type="Enrollment",
            entity_id=str(enrollment_id),
            details={
                "new_class_id": str(new_class_id),
                "new_section_id": str(new_section_id),
                "new_session_id": str(new_session_id),
                "new_roll_no": new_roll_no,
            },
        )
        return promoted

    @transaction.atomic
    def retain(
        self,
        enrollment_id: UUID,
        new_session_id: UUID,
        new_roll_no: str = "",
    ) -> Enrollment:
        enrollment = self.repo.get_by_id_or_raise(enrollment_id, "Enrollment not found.")
        self.log.info("retaining_enrollment", enrollment_id=enrollment_id)
        retained = enrollment.retain_in_same_class(new_session_id, new_roll_no)
        AuditLog.log(
            action="student_retained",
            entity_type="Enrollment",
            entity_id=str(enrollment_id),
            details={
                "new_session_id": str(new_session_id),
                "new_roll_no": new_roll_no,
            },
        )
        return retained

    @transaction.atomic
    def transfer_out(self, enrollment_id: UUID, remarks: str = "") -> None:
        enrollment = self.repo.get_by_id_or_raise(enrollment_id, "Enrollment not found.")
        self.log.info("transferring_enrollment", enrollment_id=enrollment_id)
        enrollment.transfer_out(remarks)
        AuditLog.log(
            action="student_transferred",
            entity_type="Enrollment",
            entity_id=str(enrollment_id),
            details={"remarks": remarks},
        )

    @transaction.atomic
    def bulk_enroll(
        self,
        student_ids: list[UUID],
        session_id: UUID,
        class_id: UUID,
        section_id: UUID,
        roll_nos: dict[UUID, str] | None = None,
    ) -> list[Enrollment]:
        roll_nos = roll_nos or {}
        enrollments = []
        for sid in student_ids:
            if self.repo.exists(student_id=sid, session_id=session_id):
                self.log.warning("skip_duplicate_bulk", student_id=sid)
                continue
            enrollment = self.repo.create(
                student_id=sid,
                session_id=session_id,
                class_field_id=class_id,
                section_id=section_id,
                roll_no=roll_nos.get(sid, ""),
                status="active",
            )
            enrollments.append(enrollment)
        self.log.info("bulk_enroll_complete", count=len(enrollments))
        return enrollments

    def get_active_enrollment(self, student_id: UUID, session_id: UUID) -> Enrollment | None:
        return self.repo.get_active(student_id, session_id)

    def get_class_enrollments(
        self, session_id: UUID, class_id: UUID, section_id: UUID
    ):
        return self.repo.get_class_enrollments(session_id, class_id, section_id)
