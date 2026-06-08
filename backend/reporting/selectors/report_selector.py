"""Report selector: complex read queries for reporting."""

from __future__ import annotations

from uuid import UUID

from django.db.models import QuerySet

from shared.base_selector import BaseSelector
from enrollments.models import Enrollment
from results.models import SubjectResult, MarksEntry


class ReportSelector(BaseSelector):
    """Read-only queries for reporting needs."""

    def get_enrollment_with_details(
        self,
        enrollment_id: UUID,
    ) -> Enrollment | None:
        """Fetch enrollment with all related details for report generation."""
        return (
            Enrollment.objects.select_related(
                "student", "session", "class_field", "section"
            )
            .filter(id=enrollment_id)
            .first()
        )

    def get_all_results_for_enrollment(
        self,
        enrollment_id: UUID,
    ) -> QuerySet[SubjectResult]:
        """Fetch all subject results for an enrollment."""
        return (
            SubjectResult.objects.filter(enrollment_id=enrollment_id)
            .select_related("subject")
            .order_by("subject__code")
        )

    def get_class_enrollments(
        self,
        class_id: UUID,
        section_id: UUID,
        session_id: UUID,
    ) -> QuerySet[Enrollment]:
        """Fetch active enrollments for a class-section-session."""
        return (
            Enrollment.objects.filter(
                class_field_id=class_id,
                section_id=section_id,
                session_id=session_id,
                status="active",
            )
            .select_related("student", "session", "class_field", "section")
            .order_by("roll_no")
        )

    def get_all_marks_entries_for_enrollment(
        self,
        enrollment_id: UUID,
    ) -> QuerySet[MarksEntry]:
        """Fetch all marks entries for an enrollment."""
        return (
            MarksEntry.objects.filter(enrollment_id=enrollment_id)
            .select_related("subject", "assessment_type")
            .order_by("subject__code", "assessment_type__display_order")
        )

    def get_all_results_for_class(
        self,
        enrollment_ids: list[UUID],
    ) -> QuerySet[SubjectResult]:
        """Fetch all subject results for a set of enrollments."""
        return (
            SubjectResult.objects.filter(enrollment_id__in=enrollment_ids)
            .select_related("enrollment", "enrollment__student", "subject")
            .order_by("enrollment__roll_no", "subject__code")
        )
