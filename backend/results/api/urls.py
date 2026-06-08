"""URL configuration for results API."""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from results.api.views import MarksEntryViewSet, SubjectResultViewSet
from results.api.publication_views import (
    ResultPublicationListView,
    ResultPublicationDetailView,
    ResultPublicationSubmitView,
    ResultPublicationPublishView,
    ResultPublicationUnpublishView,
    ResultPublicationSummaryView,
)

router = DefaultRouter()
router.register(r"marks-entries", MarksEntryViewSet, basename="marks-entries")
router.register(r"subject-results", SubjectResultViewSet, basename="subject-results")

urlpatterns = [
    path("", include(router.urls)),
    # Publication endpoints
    path("publications/", ResultPublicationListView.as_view(), name="publication-list"),
    path("publications/summary/", ResultPublicationSummaryView.as_view(), name="publication-summary"),
    path("publications/<uuid:pk>/", ResultPublicationDetailView.as_view(), name="publication-detail"),
    path("publications/<uuid:pk>/submit/", ResultPublicationSubmitView.as_view(), name="publication-submit"),
    path("publications/<uuid:pk>/publish/", ResultPublicationPublishView.as_view(), name="publication-publish"),
    path("publications/<uuid:pk>/unpublish/", ResultPublicationUnpublishView.as_view(), name="publication-unpublish"),
]
