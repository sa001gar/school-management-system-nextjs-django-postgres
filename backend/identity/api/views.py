"""API views for identity module."""

from rest_framework import viewsets, status
from rest_framework.response import Response

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
