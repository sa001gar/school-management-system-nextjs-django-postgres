"""Repository for Subject persistence."""

from __future__ import annotations

from django.db.models import QuerySet

from academics.models import Subject
from shared.base_repository import BaseRepository


class SubjectRepository(BaseRepository[Subject]):
    model = Subject

    def get_by_code(self, code: str) -> Subject | None:
        return Subject.objects.filter(code=code).first()

    def list_by_type(self, subject_type: str) -> QuerySet[Subject]:
        return Subject.objects.filter(subject_type=subject_type).order_by("code")
