"""Repository for AdminProfile persistence."""

from __future__ import annotations

from uuid import UUID

from identity.models import AdminProfile
from shared.base_repository import BaseRepository


class AdminRepository(BaseRepository):
    model = AdminProfile

    def get_by_user_id(self, user_id: UUID) -> AdminProfile | None:
        return AdminProfile.objects.filter(user_id=user_id).first()
