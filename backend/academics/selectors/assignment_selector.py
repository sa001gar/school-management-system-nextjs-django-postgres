"""Selectors for TeacherAssignment queries."""

from __future__ import annotations

from uuid import UUID

from django.db.models import QuerySet

from academics.models import TeacherAssignment
from shared.base_selector import BaseSelector


class AssignmentSelector(BaseSelector):
    """Read-only queries for teacher assignments."""

    def get_teacher_assignments(
        self, teacher_id: UUID, session_id: UUID
    ) -> QuerySet[TeacherAssignment]:
        return TeacherAssignment.objects.filter(
            teacher_id=teacher_id, session_id=session_id, is_active=True
        ).select_related("class_ref", "section", "subject")

    def get_class_assignments(
        self, class_id: UUID, session_id: UUID
    ) -> QuerySet[TeacherAssignment]:
        return TeacherAssignment.objects.filter(
            class_id=class_id, session_id=session_id, is_active=True
        ).select_related("teacher", "section", "subject")
