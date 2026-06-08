"""Service for Admin profile operations."""

from __future__ import annotations

from uuid import UUID

from identity.models import AdminProfile
from identity.repositories.admin_repository import AdminRepository
from shared.base_service import BaseService


class AdminService(BaseService):
    """Business logic for admin management."""

    def __init__(self):
        self.repo = AdminRepository()

    def create_admin(self, user_id: UUID, name: str) -> AdminProfile:
        return self.repo.create(user_id=user_id, name=name)

    def get_by_user_id(self, user_id: UUID) -> AdminProfile | None:
        return self.repo.get_by_user_id(user_id)

    def get_by_id(self, admin_id: UUID) -> AdminProfile | None:
        return self.repo.get_by_id(admin_id)

    def update_name(self, admin_id: UUID, name: str) -> AdminProfile | None:
        return self.repo.update(admin_id, name=name)

    def list_all(self):
        return self.repo.list_all()
