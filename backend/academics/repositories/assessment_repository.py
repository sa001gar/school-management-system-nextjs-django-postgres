"""Repository for AssessmentType persistence."""

from __future__ import annotations

from academics.models import AssessmentType
from shared.base_repository import BaseRepository


class AssessmentRepository(BaseRepository[AssessmentType]):
    model = AssessmentType

    def get_by_code(self, code: str) -> AssessmentType | None:
        return AssessmentType.objects.filter(code=code).first()
