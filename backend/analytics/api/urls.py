"""URL configuration for analytics API."""

from django.urls import path
from analytics.api.views import (
    PassFailRatioView,
    SubjectDifficultyView,
    GradeDistributionView,
    TopPerformersView,
    BottomPerformersView,
    SessionComparisonView,
    ClassPerformanceView,
)

urlpatterns = [
    path("pass-fail/", PassFailRatioView.as_view(), name="pass-fail-ratio"),
    path("subject-difficulty/", SubjectDifficultyView.as_view(), name="subject-difficulty"),
    path("grade-distribution/", GradeDistributionView.as_view(), name="grade-distribution"),
    path("top-performers/", TopPerformersView.as_view(), name="top-performers"),
    path("bottom-performers/", BottomPerformersView.as_view(), name="bottom-performers"),
    path("session-comparison/", SessionComparisonView.as_view(), name="session-comparison"),
    path("class-performance/", ClassPerformanceView.as_view(), name="class-performance"),
]
