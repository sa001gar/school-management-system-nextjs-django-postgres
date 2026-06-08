"""Student repository: data access for Student model."""

from __future__ import annotations

from django.db.models import QuerySet

from shared.base_repository import BaseRepository
from enrollments.models import Student


class StudentRepository(BaseRepository[Student]):
    """Repository for Student data access."""

    model = Student

    def get_by_student_id(self, student_id: str) -> Student | None:
        try:
            return self.model.objects.get(student_id=student_id)
        except self.model.DoesNotExist:
            return None

    def search_by_name(self, query: str) -> QuerySet[Student]:
        return self.model.objects.filter(name__icontains=query, is_active=True)
