"""Student service: business logic for Student CRUD and search."""

from __future__ import annotations

from uuid import UUID

import structlog
from django.db import transaction

from shared.base_service import BaseService
from enrollments.models import Student
from enrollments.repositories.student_repository import StudentRepository

logger = structlog.get_logger(__name__)


class StudentService(BaseService):
    """Handles Student creation, update, retrieval, and search."""

    def __init__(self) -> None:
        self.repo = StudentRepository()

    @transaction.atomic
    def create(self, **kwargs) -> Student:
        student_id = Student.generate_student_id()
        self.log.info("creating_student", student_id=student_id)
        student = self.repo.create(student_id=student_id, **kwargs)
        student.set_default_password()
        student.save(update_fields=["password_hash"])
        return student

    def update(self, student_id: UUID, **kwargs) -> Student | None:
        self.log.info("updating_student", student_id=student_id)
        return self.repo.update(student_id, **kwargs)

    def get_by_id(self, student_id: UUID) -> Student | None:
        return self.repo.get_by_id(student_id)

    def list_all(self):
        return self.repo.list_all()

    def search_by_name(self, query: str):
        return self.repo.search_by_name(query)

    def generate_student_id(self) -> str:
        return Student.generate_student_id()
