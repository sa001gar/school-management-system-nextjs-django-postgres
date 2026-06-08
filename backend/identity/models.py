"""Identity models: AdminProfile, TeacherProfile."""

from django.db import models

from shared.base_model import BaseModel


class AdminProfile(BaseModel):
    """Admin profile linked to User."""

    user = models.OneToOneField(
        "core.User", on_delete=models.CASCADE, related_name="admin_profile"
    )
    name = models.CharField(max_length=255)

    class Meta:
        db_table = "admin_profiles"
        ordering = ["name"]

    def __str__(self) -> str:
        return f"{self.name} ({self.user.email})"


class TeacherProfile(BaseModel):
    """Teacher profile linked to User."""

    user = models.OneToOneField(
        "core.User", on_delete=models.CASCADE, related_name="teacher_profile"
    )
    name = models.CharField(max_length=255)

    class Meta:
        db_table = "teacher_profiles"
        ordering = ["name"]

    def __str__(self) -> str:
        return f"{self.name} ({self.user.email})"
