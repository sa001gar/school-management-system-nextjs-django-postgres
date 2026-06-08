"""Generic base repository with CRUD operations."""

from __future__ import annotations

from typing import TypeVar, Generic, Type
from uuid import UUID

from django.db import models
from django.db.models import QuerySet

from shared.base_model import BaseModel

T = TypeVar("T", bound=BaseModel)


class BaseRepository(Generic[T]):
    """Generic repository providing CRUD operations for a model."""

    model: Type[T]

    def get_by_id(self, id: UUID) -> T | None:
        try:
            return self.model.objects.get(id=id)
        except self.model.DoesNotExist:
            return None

    def get_by_id_or_raise(self, id: UUID, not_found_msg: str = "Not found") -> T:
        obj = self.get_by_id(id)
        if obj is None:
            from shared.exceptions import NotFoundException
            raise NotFoundException(not_found_msg)
        return obj

    def create(self, **kwargs) -> T:
        return self.model.objects.create(**kwargs)

    def update(self, id: UUID, **kwargs) -> T | None:
        obj = self.get_by_id(id)
        if obj is None:
            return None
        for key, value in kwargs.items():
            setattr(obj, key, value)
        obj.save()
        return obj

    def delete(self, id: UUID) -> bool:
        obj = self.get_by_id(id)
        if obj is None:
            return False
        obj.delete()
        return True

    def exists(self, **filters) -> bool:
        return self.model.objects.filter(**filters).exists()

    def list_all(self) -> QuerySet[T]:
        return self.model.objects.all()

    def filter(self, **filters) -> QuerySet[T]:
        return self.model.objects.filter(**filters)

    def count(self, **filters) -> int:
        return self.model.objects.filter(**filters).count()
