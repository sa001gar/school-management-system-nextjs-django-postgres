"""Repository for AcademicSession persistence."""

from __future__ import annotations

from django.db.models import QuerySet

from academics.models import AcademicSession
from shared.base_repository import BaseRepository


class SessionRepository(BaseRepository[AcademicSession]):
    model = AcademicSession

    def get_active(self) -> AcademicSession | None:
        return AcademicSession.objects.filter(is_active=True).first()

    def get_by_name(self, name: str) -> AcademicSession | None:
        return AcademicSession.objects.filter(name=name).first()

    def list_all(self) -> QuerySet[AcademicSession]:
        return AcademicSession.objects.all().order_by("-start_date")
