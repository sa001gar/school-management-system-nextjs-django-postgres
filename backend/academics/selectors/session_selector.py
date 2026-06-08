"""Selectors for AcademicSession queries."""

from __future__ import annotations

from django.db.models import QuerySet

from academics.models import AcademicSession
from shared.base_selector import BaseSelector


class SessionSelector(BaseSelector):
    """Read-only queries for academic sessions."""

    def get_active_session(self) -> AcademicSession | None:
        return AcademicSession.objects.filter(is_active=True).first()

    def list_ordered(self) -> QuerySet[AcademicSession]:
        return AcademicSession.objects.all().order_by("-start_date")
