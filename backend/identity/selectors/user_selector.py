"""Selectors for identity queries."""

from __future__ import annotations

from django.db.models import QuerySet

from identity.models import TeacherProfile, AdminProfile
from shared.base_selector import BaseSelector


class TeacherSelector(BaseSelector):
    def list_active_teachers(self) -> QuerySet[TeacherProfile]:
        return TeacherProfile.objects.filter(user__is_active=True)

    def get_teacher_with_user(self, teacher_id):
        return TeacherProfile.objects.select_related("user").filter(id=teacher_id).first()


class AdminSelector(BaseSelector):
    def list_active_admins(self) -> QuerySet[AdminProfile]:
        return AdminProfile.objects.filter(user__is_active=True)
