"""MarksEntry selector: read-only queries for marks entries."""

from __future__ import annotations

from uuid import UUID

from django.db.models import QuerySet

from shared.base_selector import BaseSelector
from results.models import MarksEntry


class MarksEntrySelector(BaseSelector):
    """Read-only queries for MarksEntry data."""

    def list_by_class_subject(
        self, enrollment_ids: list[UUID], subject_id: UUID
    ) -> QuerySet[MarksEntry]:
        return (
            MarksEntry.objects.filter(
                enrollment_id__in=enrollment_ids,
                subject_id=subject_id,
            )
            .select_related("enrollment__student", "assessment_type", "entered_by")
            .order_by("enrollment__roll_no", "assessment_type__display_order")
        )

    def get_entry(
        self,
        enrollment_id: UUID,
        subject_id: UUID,
        assessment_type_id: UUID,
    ) -> MarksEntry | None:
        return (
            MarksEntry.objects.filter(
                enrollment_id=enrollment_id,
                subject_id=subject_id,
                assessment_type_id=assessment_type_id,
            )
            .select_related("subject", "assessment_type", "entered_by")
            .first()
        )

    def list_for_enrollment(self, enrollment_id: UUID) -> QuerySet[MarksEntry]:
        return (
            MarksEntry.objects.filter(enrollment_id=enrollment_id)
            .select_related("subject", "assessment_type", "entered_by")
            .order_by("subject__code", "assessment_type__display_order")
        )
