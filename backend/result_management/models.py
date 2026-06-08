"""
Result Management Models - Models for managing student results and marks.
"""
import uuid
from django.db import models
from django.utils import timezone


class StudentResult(models.Model):
    """Main student result for regular subjects."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey('core_services.Student', on_delete=models.CASCADE, related_name='results')
    subject = models.ForeignKey('core_services.Subject', on_delete=models.CASCADE, related_name='results')
    session = models.ForeignKey('core_services.Session', on_delete=models.CASCADE, related_name='results')
    school = models.ForeignKey('core_services.School', on_delete=models.CASCADE, null=True, blank=True, related_name='student_results')
    
    # First term marks
    first_summative_full = models.IntegerField(default=40)
    first_summative_obtained = models.IntegerField(default=0)
    first_formative_full = models.IntegerField(default=10)
    first_formative_obtained = models.IntegerField(default=0)
    
    # Second term marks
    second_summative_full = models.IntegerField(default=40)
    second_summative_obtained = models.IntegerField(default=0)
    second_formative_full = models.IntegerField(default=10)
    second_formative_obtained = models.IntegerField(default=0)
    
    # Third term marks
    third_summative_full = models.IntegerField(default=40)
    third_summative_obtained = models.IntegerField(default=0)
    third_formative_full = models.IntegerField(default=10)
    third_formative_obtained = models.IntegerField(default=0)
    
    # Calculated fields
    total_marks = models.IntegerField(default=0)
    grade = models.CharField(max_length=10, default='F')
    conduct = models.CharField(max_length=50, default='Good')
    attendance_days = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'student_results'
        unique_together = ['student', 'subject', 'session']
        indexes = [
            # Composite index for fetching results by session + student (most common)
            models.Index(
                fields=['session', 'student'],
                name='idx_result_session_student'
            ),
            # Index for subject-based queries
            models.Index(
                fields=['session', 'subject'],
                name='idx_result_session_subject'
            ),
            # Index for grade filtering
            models.Index(
                fields=['grade'],
                name='idx_result_grade'
            ),
        ]
    
    def calculate_total_marks(self):
        """Calculate total obtained marks."""
        return (
            self.first_summative_obtained + self.first_formative_obtained +
            self.second_summative_obtained + self.second_formative_obtained +
            self.third_summative_obtained + self.third_formative_obtained
        )
    
    def calculate_full_marks(self):
        """Calculate total full marks."""
        return (
            self.first_summative_full + self.first_formative_full +
            self.second_summative_full + self.second_formative_full +
            self.third_summative_full + self.third_formative_full
        )
    
    def calculate_grade(self):
        """Calculate grade based on percentage."""
        full_marks = self.calculate_full_marks()
        if full_marks == 0:
            return 'D'
        percentage = (self.total_marks / full_marks) * 100
        if percentage >= 90:
            return 'AA'
        if percentage >= 75:
            return 'A+'
        if percentage >= 60:
            return 'A'
        if percentage >= 45:
            return 'B+'
        if percentage >= 34:
            return 'B'
        if percentage >= 25:
            return 'C'
        return 'D'
    
    def save(self, *args, **kwargs):
        self.total_marks = self.calculate_total_marks()
        self.grade = self.calculate_grade()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.student.name} - {self.subject.name} - {self.grade}"


class StudentCocurricularResult(models.Model):
    """Student result for co-curricular activities."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey('core_services.Student', on_delete=models.CASCADE, related_name='cocurricular_results')
    cocurricular_subject = models.ForeignKey('core_services.CocurricularSubject', on_delete=models.CASCADE, related_name='results')
    session = models.ForeignKey('core_services.Session', on_delete=models.CASCADE, related_name='cocurricular_results')
    school = models.ForeignKey('core_services.School', on_delete=models.CASCADE, null=True, blank=True, related_name='student_cocurricular_results')
    
    # Term marks (new field structure)
    first_term_marks = models.IntegerField(default=0)
    second_term_marks = models.IntegerField(default=0)
    final_term_marks = models.IntegerField(default=0)
    full_marks = models.IntegerField(default=50)
    
    # Grades
    first_term_grade = models.CharField(max_length=10, default='A')
    second_term_grade = models.CharField(max_length=10, default='A')
    final_term_grade = models.CharField(max_length=10, default='A')
    overall_grade = models.CharField(max_length=10, default='A')
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'student_cocurricular_results'
        unique_together = ['student', 'cocurricular_subject', 'session']
        indexes = [
            # Composite index for fetching by session + student
            models.Index(
                fields=['session', 'student'],
                name='idx_cocurr_sess_stu'
            ),
        ]
    
    @property
    def total_marks(self):
        return self.first_term_marks + self.second_term_marks + self.final_term_marks
    
    def __str__(self):
        return f"{self.student.name} - {self.cocurricular_subject.name} - {self.overall_grade}"


class StudentOptionalResult(models.Model):
    """Student result for optional subjects."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey('core_services.Student', on_delete=models.CASCADE, related_name='optional_results')
    optional_subject = models.ForeignKey('core_services.OptionalSubject', on_delete=models.CASCADE, related_name='results')
    session = models.ForeignKey('core_services.Session', on_delete=models.CASCADE, related_name='optional_results')
    school = models.ForeignKey('core_services.School', on_delete=models.CASCADE, null=True, blank=True, related_name='student_optional_results')
    
    obtained_marks = models.IntegerField(default=0)
    full_marks = models.IntegerField(default=50)
    grade = models.CharField(max_length=10, default='F')
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'student_optional_results'
        unique_together = ['student', 'optional_subject', 'session']
        indexes = [
            # Composite index for fetching by session + student
            models.Index(
                fields=['session', 'student'],
                name='idx_optional_session_student'
            ),
        ]
    
    def calculate_grade(self):
        """Calculate grade based on percentage."""
        if self.full_marks == 0:
            return 'D'
        percentage = (self.obtained_marks / self.full_marks) * 100
        if percentage >= 90:
            return 'AA'
        if percentage >= 75:
            return 'A+'
        if percentage >= 60:
            return 'A'
        if percentage >= 45:
            return 'B+'
        if percentage >= 34:
            return 'B'
        if percentage >= 25:
            return 'C'
        return 'D'
    
    def save(self, *args, **kwargs):
        self.grade = self.calculate_grade()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.student.name} - {self.optional_subject.name} - {self.grade}"
