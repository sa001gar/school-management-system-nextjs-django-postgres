"""URL configuration for Student Portal API."""

from django.urls import path

from . import views

app_name = "student"

urlpatterns = [
    path("profile/", views.StudentProfileView.as_view(), name="student-profile"),
    path("results/", views.StudentResultsView.as_view(), name="student-results"),
    path("report-card/", views.StudentReportCardView.as_view(), name="student-report-card"),
    path("marksheet/", views.StudentMarksheetView.as_view(), name="student-marksheet"),
    path("ranking/", views.StudentRankingView.as_view(), name="student-ranking"),
    path(
        "enrollment-history/",
        views.StudentEnrollmentHistoryView.as_view(),
        name="student-enrollment-history",
    ),
]
