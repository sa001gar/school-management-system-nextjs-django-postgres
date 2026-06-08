"""API views for audit logs."""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from core.permissions import IsAdmin
from core.services.audit_log_service import AuditLogService


class AuditLogListView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        service = AuditLogService()

        action = request.query_params.get("action", "")
        entity_type = request.query_params.get("entity_type", "")
        user_id = request.query_params.get("user_id", "")
        date_from = request.query_params.get("date_from", "")
        date_to = request.query_params.get("date_to", "")
        search = request.query_params.get("search", "")
        page = int(request.query_params.get("page", 1))
        page_size = int(request.query_params.get("page_size", 20))

        from core.models_audit import AuditLog
        queryset = AuditLog.objects.all()

        if action:
            queryset = queryset.filter(action=action)
        if entity_type:
            queryset = queryset.filter(entity_type=entity_type)
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        if date_from:
            queryset = queryset.filter(created_at__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__date__lte=date_to)
        if search:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(entity_type__icontains=search)
                | Q(entity_id__icontains=search)
                | Q(action__icontains=search)
            )

        count = queryset.count()
        start = (page - 1) * page_size
        end = start + page_size
        logs = queryset.select_related("user")[start:end]

        results = [
            {
                "id": str(log.id),
                "action": log.action,
                "entity_type": log.entity_type,
                "entity_id": log.entity_id,
                "details": log.details,
                "ip_address": log.ip_address,
                "user_agent": log.user_agent,
                "user": str(log.user) if log.user else None,
                "user_email": log.user.email if log.user else None,
                "created_at": log.created_at.isoformat(),
            }
            for log in logs
        ]

        return Response({
            "count": count,
            "results": results,
        })
