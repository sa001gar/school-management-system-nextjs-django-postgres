"""DRF router URLs for the enrollments module."""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from enrollments.api.views import StudentViewSet, EnrollmentViewSet, ClassTeacherViewSet

router = DefaultRouter()
router.register(r"students", StudentViewSet, basename="student")
router.register(r"enrollments", EnrollmentViewSet, basename="enrollment")
router.register(r"class-teachers", ClassTeacherViewSet, basename="classteacher")

urlpatterns = [
    path("", include(router.urls)),
]
