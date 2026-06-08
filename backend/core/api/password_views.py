"""API views for password management."""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from core.permissions import IsAdmin
from core.services.auth_service import AuthService


class ChangePasswordView(APIView):
    """POST /auth/change-password/ — Body: { current_password, new_password }"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        current_password = request.data.get("current_password", "")
        new_password = request.data.get("new_password", "")

        if not current_password or not new_password:
            return Response(
                {"detail": "current_password and new_password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(new_password) < 8:
            return Response(
                {"detail": "New password must be at least 8 characters."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = request.user
        if not user.check_password(current_password):
            return Response(
                {"detail": "Current password is incorrect."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save()

        from core.services.audit_log_service import AuditLogService
        audit = AuditLogService()
        audit.log_action(
            action="password_reset",
            user=user,
            entity_type="User",
            entity_id=str(user.id),
            details={"type": "change_password"},
            ip_address=request.META.get("REMOTE_ADDR"),
            user_agent=request.META.get("HTTP_USER_AGENT", ""),
        )

        return Response({"detail": "Password changed successfully."})


class ResetPasswordView(APIView):
    """POST /auth/reset-password/ — Body: { user_id, new_password }"""
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request):
        user_id = request.data.get("user_id", "")
        new_password = request.data.get("new_password", "")

        if not user_id or not new_password:
            return Response(
                {"detail": "user_id and new_password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(new_password) < 8:
            return Response(
                {"detail": "New password must be at least 8 characters."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from django.contrib.auth import get_user_model
        User = get_user_model()

        try:
            target_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        target_user.set_password(new_password)
        target_user.save()

        from core.services.audit_log_service import AuditLogService
        audit = AuditLogService()
        audit.log_action(
            action="password_reset",
            user=request.user,
            entity_type="User",
            entity_id=str(target_user.id),
            details={"type": "admin_reset", "target_user_id": str(target_user.id)},
            ip_address=request.META.get("REMOTE_ADDR"),
            user_agent=request.META.get("HTTP_USER_AGENT", ""),
        )

        return Response({"detail": f"Password reset for {target_user.email} successfully."})
