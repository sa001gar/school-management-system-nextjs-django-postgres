"""Service for Teacher profile operations."""

from __future__ import annotations

from uuid import UUID

from identity.models import TeacherProfile
from identity.repositories.teacher_repository import TeacherRepository
from shared.base_service import BaseService


class TeacherService(BaseService):
    """Business logic for teacher management."""

    def __init__(self):
        self.repo = TeacherRepository()

    def create_teacher(self, user_id: UUID, name: str) -> TeacherProfile:
        return self.repo.create(user_id=user_id, name=name)

    def get_by_user_id(self, user_id: UUID) -> TeacherProfile | None:
        return self.repo.get_by_user_id(user_id)

    def get_by_id(self, teacher_id: UUID) -> TeacherProfile | None:
        return self.repo.get_by_id(teacher_id)

    def update_name(self, teacher_id: UUID, name: str) -> TeacherProfile | None:
        return self.repo.update(teacher_id, name=name)

    def list_all(self):
        return self.repo.list_all()
