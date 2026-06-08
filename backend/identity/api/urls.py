"""URL configuration for identity API."""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from identity.api.views import TeacherViewSet, AdminViewSet

router = DefaultRouter()
router.register(r"teachers", TeacherViewSet, basename="teachers")
router.register(r"admins", AdminViewSet, basename="admins")

urlpatterns = [
    path("", include(router.urls)),
]
