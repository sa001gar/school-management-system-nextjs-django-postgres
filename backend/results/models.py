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


class ResultPublication(BaseModel):
    """Tracks result publication status for a class in a session."""

    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("under_review", "Under Review"),
        ("published", "Published"),
        ("unpublished", "Unpublished"),
    ]

    session = models.ForeignKey(
        "academics.AcademicSession",
        on_delete=models.CASCADE,
        related_name="result_publications",
    )
    class_field = models.ForeignKey(
        "academics.Class",
        on_delete=models.CASCADE,
        related_name="result_publications",
    )
    section = models.ForeignKey(
        "academics.Section",
        on_delete=models.CASCADE,
        related_name="result_publications",
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    published_by = models.ForeignKey(
        "core.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="published_results",
    )
    published_at = models.DateTimeField(null=True, blank=True)
    remarks = models.TextField(blank=True, default="")

    class Meta:
        db_table = "result_publications"
        ordering = ["-created_at"]
        unique_together = [("session", "class_field", "section")]
        indexes = [
            models.Index(fields=["status"], name="idx_pub_status"),
            models.Index(fields=["session"], name="idx_pub_session"),
        ]

    def __str__(self) -> str:
        return f"{self.class_field.name} - {self.section.name} ({self.session.name}): {self.status}"

    def publish(self, user):
        from django.utils import timezone
        self.status = "published"
        self.published_by = user
        self.published_at = timezone.now()
        self.save(update_fields=["status", "published_by", "published_at"])

    def unpublish(self):
        self.status = "unpublished"
        self.published_by = None
        self.published_at = None
        self.save(update_fields=["status", "published_by", "published_at"])

    def submit_for_review(self):
        self.status = "under_review"
        self.save(update_fields=["status"])
