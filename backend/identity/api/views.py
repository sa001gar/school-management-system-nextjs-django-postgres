"""API views for identity module."""

from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action

from core.permissions import IsAdmin
from identity.services.teacher_service import TeacherService
from identity.services.admin_service import AdminService
from identity.api.serializers import TeacherSerializer, TeacherCreateSerializer, AdminSerializer


class TeacherViewSet(viewsets.ViewSet):
    permission_classes = [IsAdmin]
    service = TeacherService()

    def list(self, request):
        teachers = self.service.list_all()
        data = []
        for t in teachers:
            data.append({
                "id": str(t.id),
                "name": t.name,
                "email": t.user.email,
                "user_id": str(t.user_id),
                "created_at": t.created_at.isoformat(),
            })
        return Response(data)

    def retrieve(self, request, pk=None):
        teacher = self.service.get_by_id(pk)
        if not teacher:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response({
            "id": str(teacher.id),
            "name": teacher.name,
            "email": teacher.user.email,
            "user_id": str(teacher.user_id),
            "created_at": teacher.created_at.isoformat(),
        })

    def create(self, request):
        serializer = TeacherCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        from core.repositories.user_repository import UserRepository
        user_repo = UserRepository()
        user = user_repo.create_user(
            email=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
            role="teacher",
        )
        teacher = self.service.create_teacher(
            user_id=user.id,
            name=serializer.validated_data["name"],
        )

        return Response({
            "id": str(teacher.id),
            "name": teacher.name,
            "email": user.email,
            "user_id": str(user.id),
        }, status=status.HTTP_201_CREATED)

    def partial_update(self, request, pk=None):
        teacher = self.service.get_by_id(pk)
        if not teacher:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)

        name = request.data.get("name")
        email = request.data.get("email")

        if name:
            self.service.update_name(teacher.id, name)

        if email:
            user = teacher.user
            user.email = email
            user.save()

        return Response({
            "id": str(teacher.id),
            "name": teacher.name if not name else name,
            "email": email or teacher.user.email,
            "user_id": str(teacher.user_id),
        })

    def destroy(self, request, pk=None):
        teacher = self.service.get_by_id(pk)
        if not teacher:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        # Delete user (cascades to teacher profile)
        teacher.user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminViewSet(viewsets.ViewSet):
    permission_classes = [IsAdmin]
    service = AdminService()

    def list(self, request):
        admins = self.service.list_all()
        data = []
        for a in admins:
            data.append({
                "id": str(a.id),
                "name": a.name,
                "email": a.user.email,
                "user_id": str(a.user_id),
            })
        return Response(data)

    def retrieve(self, request, pk=None):
        admin = self.service.get_by_id(pk)
        if not admin:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response({
            "id": str(admin.id),
            "name": admin.name,
            "email": admin.user.email,
            "user_id": str(admin.user_id),
        })

    def create(self, request):
        name = request.data.get("name", "")
        email = request.data.get("email", "")
        password = request.data.get("password", "")

        if not name or not email or not password:
            return Response(
                {"detail": "name, email, and password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(password) < 8:
            return Response(
                {"detail": "Password must be at least 8 characters."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from core.repositories.user_repository import UserRepository
        user_repo = UserRepository()
        existing = user_repo.get_by_email(email)
        if existing:
            return Response(
                {"detail": "A user with this email already exists."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = user_repo.create_user(email=email, password=password, role="admin")
        admin_profile = self.service.create_admin(user_id=user.id, name=name)

        return Response({
            "id": str(admin_profile.id),
            "name": admin_profile.name,
            "email": user.email,
            "user_id": str(user.id),
        }, status=status.HTTP_201_CREATED)

    def partial_update(self, request, pk=None):
        admin = self.service.get_by_id(pk)
        if not admin:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)

        name = request.data.get("name")
        email = request.data.get("email")

        if name:
            self.service.update_name(admin.id, name)

        if email:
            user = admin.user
            user.email = email
            user.save()

        return Response({
            "id": str(admin.id),
            "name": admin.name if not name else name,
            "email": email or admin.user.email,
            "user_id": str(admin.user_id),
        })

    def destroy(self, request, pk=None):
        admin = self.service.get_by_id(pk)
        if not admin:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        admin.user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"], url_path="reset-password")
    def reset_password(self, request, pk=None):
        admin = self.service.get_by_id(pk)
        if not admin:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)

        new_password = request.data.get("new_password", "")
        if not new_password:
            return Response(
                {"detail": "new_password is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(new_password) < 8:
            return Response(
                {"detail": "Password must be at least 8 characters."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = admin.user
        user.set_password(new_password)
        user.save()

        from core.services.audit_log_service import AuditLogService
        audit = AuditLogService()
        audit.log_action(
            action="password_reset",
            user=request.user,
            entity_type="User",
            entity_id=str(user.id),
            details={"type": "admin_reset", "target_user_id": str(user.id)},
            ip_address=request.META.get("REMOTE_ADDR"),
            user_agent=request.META.get("HTTP_USER_AGENT", ""),
        )

        return Response({"detail": f"Password reset for {user.email} successfully."})
