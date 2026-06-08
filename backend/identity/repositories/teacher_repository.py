"""Repository for TeacherProfile persistence."""

from __future__ import annotations

from uuid import UUID

from identity.models import TeacherProfile
from shared.base_repository import BaseRepository


class TeacherRepository(BaseRepository):
    model = TeacherProfile

    def get_by_user_id(self, user_id: UUID) -> TeacherProfile | None:
        return TeacherProfile.objects.filter(user_id=user_id).first()
