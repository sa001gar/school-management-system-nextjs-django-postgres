"""URL configuration for reporting API."""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from reporting.api.views import ReportCardViewSet, MarksheetViewSet, RankingViewSet

router = DefaultRouter()
router.register(r"report-cards", ReportCardViewSet, basename="report-cards")
router.register(r"marksheets", MarksheetViewSet, basename="marksheets")
router.register(r"rankings", RankingViewSet, basename="rankings")

urlpatterns = [
    path("", include(router.urls)),
]
