"""Notification service: business logic for user notifications."""

from __future__ import annotations

import structlog
from django.contrib.auth import get_user_model

from core.models_audit import Notification
from shared.base_service import BaseService

User = get_user_model()
logger = structlog.get_logger(__name__)


class NotificationService(BaseService):
    """Handles notification creation, retrieval, and mark-read."""

    def create(
        self,
        user,
        notification_type: str,
        title: str,
        message: str,
        link: str = "",
    ) -> Notification:
        self.log.info(
            "notification_created",
            user_id=str(user.id),
            type=notification_type,
        )
        return Notification.create_notification(
            user=user,
            notification_type=notification_type,
            title=title,
            message=message,
            link=link,
        )

    def get_for_user(self, user, unread_only: bool = False):
        qs = Notification.objects.filter(user=user)
        if unread_only:
            qs = qs.filter(is_read=False)
        return qs[:100]

    def get_unread_count(self, user) -> int:
        return Notification.objects.filter(user=user, is_read=False).count()

    def mark_read(self, notification_id: str, user) -> bool:
        updated = Notification.objects.filter(
            id=notification_id, user=user
        ).update(is_read=True)
        return updated > 0

    def mark_all_read(self, user) -> int:
        return Notification.objects.filter(
            user=user, is_read=False
        ).update(is_read=True)

    def notify_result_published(self, students, session_name: str, class_name: str):
        for student in students:
            if student.user:
                self.create(
                    user=student.user,
                    notification_type="result_published",
                    title="Result Published",
                    message=f"Your result for {class_name} ({session_name}) has been published.",
                    link="/student/results",
                )

    def notify_password_reset(self, user, temp_password: str):
        self.create(
            user=user,
            notification_type="password_reset",
            title="Password Reset",
            message=f"Your password has been reset. Temporary password: {temp_password}",
        )
