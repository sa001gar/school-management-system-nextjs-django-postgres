"""Repository for Class persistence."""

from __future__ import annotations

from academics.models import Class
from shared.base_repository import BaseRepository


class ClassRepository(BaseRepository[Class]):
    model = Class

    def get_by_name(self, name: str) -> Class | None:
        return Class.objects.filter(name=name).first()
