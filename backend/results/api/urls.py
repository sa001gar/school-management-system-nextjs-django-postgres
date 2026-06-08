"""URL configuration for results API."""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from results.api.views import MarksEntryViewSet, SubjectResultViewSet

router = DefaultRouter()
router.register(r"marks-entries", MarksEntryViewSet, basename="marks-entries")
router.register(r"subject-results", SubjectResultViewSet, basename="subject-results")

urlpatterns = [
    path("", include(router.urls)),
]
