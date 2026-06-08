"""Results module models: MarksEntry and SubjectResult."""

from django.core.validators import MinValueValidator
from django.db import models

from shared.base_model import BaseModel


class MarksEntry(BaseModel):
    """Individual marks entry for a student in a subject assessment."""

    enrollment = models.ForeignKey(
        "enrollments.Enrollment",
        on_delete=models.CASCADE,
        related_name="marks_entries",
    )
    subject = models.ForeignKey(
        "academics.Subject",
        on_delete=models.CASCADE,
        related_name="marks_entries",
    )
    assessment_type = models.ForeignKey(
        "academics.AssessmentType",
        on_delete=models.CASCADE,
        related_name="marks_entries",
    )
    full_marks = models.PositiveIntegerField()
    obtained_marks = models.PositiveIntegerField(
        validators=[MinValueValidator(0)],
    )
    remarks = models.TextField(blank=True, default="")
    entered_by = models.ForeignKey(
        "core.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="entered_marks",
    )

    class Meta:
        db_table = "marks_entries"
        ordering = ["enrollment", "subject", "assessment_type"]
        unique_together = [("enrollment", "subject", "assessment_type")]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(obtained_marks__lte=models.F("full_marks")),
                name="marks_obtained_lte_full",
            ),
            models.CheckConstraint(
                condition=models.Q(obtained_marks__gte=0),
                name="marks_obtained_gte_zero",
            ),
        ]

    def __str__(self) -> str:
        return (
            f"{self.enrollment.student.name} - {self.subject.code} "
            f"({self.assessment_type.code}): {self.obtained_marks}/{self.full_marks}"
        )


class SubjectResult(BaseModel):
    """Computed aggregate result for a student in a subject."""

    enrollment = models.ForeignKey(
        "enrollments.Enrollment",
        on_delete=models.CASCADE,
        related_name="subject_results",
    )
    subject = models.ForeignKey(
        "academics.Subject",
        on_delete=models.CASCADE,
        related_name="subject_results",
    )
    total_obtained = models.PositiveIntegerField(default=0)
    total_full = models.PositiveIntegerField(default=0)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    grade = models.CharField(max_length=10, blank=True, default="")
    grade_point = models.DecimalField(max_digits=3, decimal_places=1, default=0)

    class Meta:
        db_table = "subject_results"
        ordering = ["enrollment", "subject"]
        unique_together = [("enrollment", "subject")]

    def __str__(self) -> str:
        return (
            f"{self.enrollment.student.name} - {self.subject.code}: "
            f"{self.total_obtained}/{self.total_full} ({self.grade})"
        )
