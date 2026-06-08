"""SubjectResult selector: read-only queries for results."""

from __future__ import annotations

from uuid import UUID

from django.db.models import QuerySet

from shared.base_selector import BaseSelector
from results.models import SubjectResult


class ResultSelector(BaseSelector):
    """Read-only queries for SubjectResult data."""

    def get_student_results(self, enrollment_id: UUID) -> QuerySet[SubjectResult]:
        return (
            SubjectResult.objects.filter(enrollment_id=enrollment_id)
            .select_related("subject")
            .order_by("subject__code")
        )

    def get_class_results(
        self, enrollment_ids: list[UUID]
    ) -> QuerySet[SubjectResult]:
        return (
            SubjectResult.objects.filter(enrollment_id__in=enrollment_ids)
            .select_related("enrollment", "enrollment__student", "subject")
            .order_by("enrollment__roll_no", "subject__code")
        )

    def get_results_by_subject(
        self, subject_id: UUID, enrollment_ids: list[UUID]
    ) -> QuerySet[SubjectResult]:
        return (
            SubjectResult.objects.filter(
                enrollment_id__in=enrollment_ids,
                subject_id=subject_id,
            )
            .select_related("enrollment", "enrollment__student")
            .order_by("enrollment__roll_no")
        )
