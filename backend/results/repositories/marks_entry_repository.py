"""MarksEntry repository: data access for MarksEntry model."""

from __future__ import annotations

from uuid import UUID

from django.db import transaction
from django.db.models import QuerySet

from shared.base_repository import BaseRepository
from results.models import MarksEntry


class MarksEntryRepository(BaseRepository[MarksEntry]):
    """Repository for MarksEntry data access."""

    model = MarksEntry

    def get_for_enrollment(self, enrollment_id: UUID) -> QuerySet[MarksEntry]:
        return (
            self.model.objects.filter(enrollment_id=enrollment_id)
            .select_related("subject", "assessment_type", "entered_by")
            .order_by("subject__code", "assessment_type__display_order")
        )

    def get_for_class_subject(
        self, enrollment_ids: list[UUID], subject_id: UUID
    ) -> QuerySet[MarksEntry]:
        return (
            self.model.objects.filter(
                enrollment_id__in=enrollment_ids,
                subject_id=subject_id,
            )
            .select_related("enrollment", "assessment_type", "entered_by")
            .order_by("enrollment__roll_no", "assessment_type__display_order")
        )

    def get_entry(
        self, enrollment_id: UUID, subject_id: UUID, assessment_type_id: UUID
    ) -> MarksEntry | None:
        try:
            return self.model.objects.get(
                enrollment_id=enrollment_id,
                subject_id=subject_id,
                assessment_type_id=assessment_type_id,
            )
        except self.model.DoesNotExist:
            return None

    @transaction.atomic
    def bulk_create_or_update(self, entries: list[dict]) -> list[MarksEntry]:
        """Upsert marks entries: update if exists, create otherwise."""
        results = []
        for entry in entries:
            existing = self.get_entry(
                enrollment_id=entry["enrollment_id"],
                subject_id=entry["subject_id"],
                assessment_type_id=entry["assessment_type_id"],
            )
            if existing:
                existing.full_marks = entry["full_marks"]
                existing.obtained_marks = entry["obtained_marks"]
                if entry.get("remarks"):
                    existing.remarks = entry["remarks"]
                if entry.get("entered_by_id"):
                    existing.entered_by_id = entry["entered_by_id"]
                existing.save()
                results.append(existing)
            else:
                obj = self.model.objects.create(
                    enrollment_id=entry["enrollment_id"],
                    subject_id=entry["subject_id"],
                    assessment_type_id=entry["assessment_type_id"],
                    full_marks=entry["full_marks"],
                    obtained_marks=entry["obtained_marks"],
                    remarks=entry.get("remarks", ""),
                    entered_by_id=entry.get("entered_by_id"),
                )
                results.append(obj)
        return results
