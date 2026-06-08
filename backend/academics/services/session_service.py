"""Service for AcademicSession operations."""

from __future__ import annotations

from uuid import UUID

from academics.models import AcademicSession
from academics.repositories.session_repository import SessionRepository
from shared.base_service import BaseService
from shared.exceptions import ConflictException, NotFoundException, SessionLockedException


class SessionService(BaseService):
    """Business logic for academic session management."""

    def __init__(self) -> None:
        self.repo = SessionRepository()

    def create(
        self, name: str, start_date: str, end_date: str
    ) -> AcademicSession:
        existing = self.repo.get_by_name(name)
        if existing:
            raise ConflictException(f"Session '{name}' already exists.")
        self.log.info("session.create", name=name)
        return self.repo.create(
            name=name, start_date=start_date, end_date=end_date
        )

    def activate(self, session_id: UUID) -> AcademicSession:
        session = self.repo.get_by_id_or_raise(session_id, "Session not found.")
        if session.is_locked:
            raise SessionLockedException("Cannot activate a locked session.")
        AcademicSession.objects.filter(is_active=True).update(is_active=False)
        session.is_active = True
        session.save()
        self.log.info("session.activate", session_id=str(session_id))
        return session

    def lock(self, session_id: UUID) -> AcademicSession:
        session = self.repo.get_by_id_or_raise(session_id, "Session not found.")
        session.is_locked = True
        session.save()
        self.log.info("session.lock", session_id=str(session_id))
        return session

    def get_active(self) -> AcademicSession | None:
        return self.repo.get_active()

    def list_all(self):
        return self.repo.list_all()
