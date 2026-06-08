"""
URL configuration for Result Management API.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    StudentResultViewSet,
    StudentCocurricularResultViewSet,
    StudentOptionalResultViewSet,
    MarksheetView
)

router = DefaultRouter()
router.register(r'student-results', StudentResultViewSet)
router.register(r'cocurricular-results', StudentCocurricularResultViewSet)
router.register(r'optional-results', StudentOptionalResultViewSet)
router.register(r'marksheet', MarksheetView, basename='marksheet')

urlpatterns = [
    path('', include(router.urls)),
]
