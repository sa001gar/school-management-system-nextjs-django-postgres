"""API views for notifications."""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from core.services.notification_service import NotificationService


class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        unread_only = request.query_params.get("unread_only", "false").lower() == "true"
        service = NotificationService()
        notifications = service.get_for_user(request.user, unread_only=unread_only)
        return Response([
            {
                "id": str(n.id),
                "notification_type": n.notification_type,
                "title": n.title,
                "message": n.message,
                "is_read": n.is_read,
                "link": n.link,
                "created_at": str(n.created_at),
            }
            for n in notifications
        ])


class UnreadNotificationCountView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        service = NotificationService()
        count = service.get_unread_count(request.user)
        return Response(count)


class MarkNotificationReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, notification_id):
        service = NotificationService()
        updated = service.mark_read(notification_id, request.user)
        if updated:
            return Response({"detail": "Notification marked as read"})
        return Response(
            {"detail": "Notification not found"},
            status=status.HTTP_404_NOT_FOUND,
        )


class MarkAllNotificationsReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        service = NotificationService()
        count = service.mark_all_read(request.user)
        return Response({"detail": f"Marked {count} notifications as read"})
