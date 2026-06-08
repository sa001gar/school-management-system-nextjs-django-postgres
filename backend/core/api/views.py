"""API views for authentication."""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.throttling import AnonThrottle

from core.services.auth_service import AuthService
from core.api.serializers import (
    LoginSerializer,
    LogoutSerializer,
    UserResponseSerializer,
)
from core.permissions import IsAdminOrTeacher


class LoginView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AnonThrottle]
    throttle_scope = "login"

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        service = AuthService()
        result = service.login(
            email=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
        )

        user = request.user.__class__.objects.get(id=result.user_id)
        user_data = UserResponseSerializer(user).data

        return Response({
            "access": result.access,
            "refresh": result.refresh,
            "user": user_data,
        })


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        service = AuthService()
        service.logout(serializer.validated_data["refresh"])

        return Response({"detail": "Logged out successfully."})


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrTeacher]

    def get(self, request):
        user = request.user
        from identity.services.teacher_service import TeacherService
        from identity.services.admin_service import AdminService

        teacher = None
        admin = None

        if user.role == "teacher":
            svc = TeacherService()
            teacher_profile = svc.get_by_user_id(user.id)
            if teacher_profile:
                teacher = {
                    "id": str(teacher_profile.id),
                    "name": teacher_profile.name,
                    "email": user.email,
                }
        elif user.role == "admin":
            svc = AdminService()
            admin_profile = svc.get_by_user_id(user.id)
            if admin_profile:
                admin = {
                    "id": str(admin_profile.id),
                    "name": admin_profile.name,
                    "email": user.email,
                }

        return Response({
            "user": UserResponseSerializer(user).data,
            "teacher": teacher,
            "admin": admin,
        })


class HealthCheckView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"status": "healthy", "version": "2.0.0"})
