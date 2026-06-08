"""URL configuration for core (auth) API."""

from django.urls import path
from core.api.views import LoginView, StudentLoginView, LogoutView, CurrentUserView, HealthCheckView
from core.api.dashboard_views import AdminDashboardView, TeacherDashboardView, StudentDashboardView
from core.api.notification_views import (
    NotificationListView,
    UnreadNotificationCountView,
    MarkNotificationReadView,
    MarkAllNotificationsReadView,
)
from core.api.audit_views import AuditLogListView
from core.api.password_views import ChangePasswordView, ResetPasswordView

urlpatterns = [
    path("health/", HealthCheckView.as_view(), name="health-check"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/student-login/", StudentLoginView.as_view(), name="student-login"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("auth/me/", CurrentUserView.as_view(), name="current-user"),
    path("auth/change-password/", ChangePasswordView.as_view(), name="change-password"),
    path("auth/reset-password/", ResetPasswordView.as_view(), name="reset-password"),
    path("audit-logs/", AuditLogListView.as_view(), name="audit-log-list"),
    # Dashboard APIs
    path("dashboard/admin/", AdminDashboardView.as_view(), name="admin-dashboard"),
    path("dashboard/teacher/", TeacherDashboardView.as_view(), name="teacher-dashboard"),
    path("dashboard/student/", StudentDashboardView.as_view(), name="student-dashboard"),
    # Notification APIs
    path("notifications/", NotificationListView.as_view(), name="notification-list"),
    path("notifications/unread-count/", UnreadNotificationCountView.as_view(), name="unread-count"),
    path("notifications/<uuid:notification_id>/read/", MarkNotificationReadView.as_view(), name="mark-read"),
    path("notifications/mark-all-read/", MarkAllNotificationsReadView.as_view(), name="mark-all-read"),
]
