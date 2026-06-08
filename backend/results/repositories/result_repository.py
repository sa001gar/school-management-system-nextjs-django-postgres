"""SubjectResult repository: data access for SubjectResult model."""

from __future__ import annotations

from uuid import UUID

from django.db.models import QuerySet

from shared.base_repository import BaseRepository
from results.models import SubjectResult


class ResultRepository(BaseRepository[SubjectResult]):
    """Repository for SubjectResult data access."""

    model = SubjectResult

    def get_for_enrollment(self, enrollment_id: UUID) -> QuerySet[SubjectResult]:
        return (
            self.model.objects.filter(enrollment_id=enrollment_id)
            .select_related("subject")
            .order_by("subject__code")
        )

    def get_for_class(
        self, enrollment_ids: list[UUID]
    ) -> QuerySet[SubjectResult]:
        return (
            self.model.objects.filter(enrollment_id__in=enrollment_ids)
            .select_related("enrollment", "subject")
            .order_by("enrollment__roll_no", "subject__code")
        )

    def get_or_none(
        self, enrollment_id: UUID, subject_id: UUID
    ) -> SubjectResult | None:
        try:
            return self.model.objects.get(
                enrollment_id=enrollment_id,
                subject_id=subject_id,
            )
        except self.model.DoesNotExist:
            return None
