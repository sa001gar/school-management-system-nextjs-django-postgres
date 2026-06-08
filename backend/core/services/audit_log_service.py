"""Audit log service: business logic for tracking system actions."""

from __future__ import annotations

from typing import Any

import structlog
from django.contrib.auth import get_user_model
from django.db import transaction

from core.models_audit import AuditLog
from shared.base_service import BaseService

User = get_user_model()
logger = structlog.get_logger(__name__)


class AuditLogService(BaseService):
    """Handles audit log creation and querying."""

    def log_action(
        self,
        action: str,
        user: Any = None,
        entity_type: str = "",
        entity_id: str = "",
        details: dict = None,
        ip_address: str = None,
        user_agent: str = "",
    ) -> AuditLog:
        self.log.info("audit_log_created", action=action, entity_type=entity_type)
        return AuditLog.log(
            action=action,
            user=user,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details or {},
            ip_address=ip_address,
            user_agent=user_agent,
        )

    def get_logs_for_entity(self, entity_type: str, entity_id: str):
        return AuditLog.objects.filter(
            entity_type=entity_type, entity_id=str(entity_id)
        ).order_by("-created_at")

    def get_logs_for_user(self, user_id: str):
        return AuditLog.objects.filter(user_id=user_id).order_by("-created_at")[:50]

    def get_recent_activity(self, limit: int = 50):
        return AuditLog.objects.all()[:limit]

    def get_action_counts(self, days: int = 30):
        from django.db.models import Count
        from django.utils import timezone
        from datetime import timedelta

        since = timezone.now() - timedelta(days=days)
        return (
            AuditLog.objects.filter(created_at__gte=since)
            .values("action")
            .annotate(count=Count("id"))
            .order_by("-count")
        )
