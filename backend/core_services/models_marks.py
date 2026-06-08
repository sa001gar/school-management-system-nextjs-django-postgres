"""
Additional models for dynamic marks distribution system.
This file extends core_services/models.py with new models.
"""
import uuid
from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError


class AssessmentCategory(models.Model):
    """
    Global assessment types that can be reused across classes.
    Examples: Unit Test 1, Mid-Term Exam, Final Exam, Project, Practical, etc.
    """
    CATEGORY_TYPE_CHOICES = [
        ('summative', 'Summative'),
        ('formative', 'Formative'),
        ('project', 'Project'),
        ('practical', 'Practical'),
        ('other', 'Other'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    school = models.ForeignKey('School', on_delete=models.CASCADE, related_name='assessment_categories')
    name = models.CharField(max_length=100, help_text="e.g., 'Unit Test 1', 'Mid-Term Exam'")
    code = models.CharField(max_length=50, help_text="e.g., 'UT1', 'MT', 'FINAL'")
    category_type = models.CharField(max_length=20, choices=CATEGORY_TYPE_CHOICES, default='summative')
    display_order = models.IntegerField(default=0, help_text="Order in which this appears in UI")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'assessment_categories'
        unique_together = ['school', 'code']
        ordering = ['display_order', 'name']
        indexes = [
            models.Index(fields=['school', 'is_active'], name='idx_ac_school_active'),
            models.Index(fields=['display_order'], name='idx_ac_display_order'),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.code})"


class CoreSubjectMarksDistribution(models.Model):
    """
    Defines marks for core subjects at class level.
    Each class can have different marks for each assessment category.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    class_ref = models.ForeignKey('Class', on_delete=models.CASCADE, related_name='core_marks_distributions', db_column='class_id')
    assessment_category = models.ForeignKey(AssessmentCategory, on_delete=models.CASCADE, related_name='core_distributions')
    full_marks = models.IntegerField(help_text="Full marks for this assessment")
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'core_subject_marks_distributions'
        unique_together = ['class_ref', 'assessment_category']
        indexes = [
            models.Index(fields=['class_ref'], name='idx_csmd_class'),
        ]
    
    def clean(self):
        if self.full_marks < 0:
            raise ValidationError("Full marks cannot be negative")
    
    def __str__(self):
        return f"{self.class_ref.name} - {self.assessment_category.name}: {self.full_marks}"


class CocurricularMarksDistribution(models.Model):
    """
    Defines marks for cocurricular subjects at class level.
    Each cocurricular subject can have different marks for each assessment category.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    class_ref = models.ForeignKey('Class', on_delete=models.CASCADE, related_name='cocurricular_marks_distributions', db_column='class_id')
    cocurricular_subject = models.ForeignKey('CocurricularSubject', on_delete=models.CASCADE, related_name='marks_distributions')
    assessment_category = models.ForeignKey(AssessmentCategory, on_delete=models.CASCADE, related_name='cocurricular_distributions')
    full_marks = models.IntegerField(help_text="Full marks for this assessment")
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'cocurricular_marks_distributions'
        unique_together = ['class_ref', 'cocurricular_subject', 'assessment_category']
        indexes = [
            models.Index(fields=['class_ref', 'cocurricular_subject'], name='idx_ccmd_class_subject'),
        ]
    
    def clean(self):
        if self.full_marks < 0:
            raise ValidationError("Full marks cannot be negative")
    
    def __str__(self):
        return f"{self.class_ref.name} - {self.cocurricular_subject.name} - {self.assessment_category.name}: {self.full_marks}"


class OptionalMarksDistribution(models.Model):
    """
    Defines marks for optional subjects at class level.
    Each optional subject can have different marks for each assessment category.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    class_ref = models.ForeignKey('Class', on_delete=models.CASCADE, related_name='optional_marks_distributions', db_column='class_id')
    optional_subject = models.ForeignKey('OptionalSubject', on_delete=models.CASCADE, related_name='marks_distributions')
    assessment_category = models.ForeignKey(AssessmentCategory, on_delete=models.CASCADE, related_name='optional_distributions')
    full_marks = models.IntegerField(help_text="Full marks for this assessment")
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'optional_marks_distributions'
        unique_together = ['class_ref', 'optional_subject', 'assessment_category']
        indexes = [
            models.Index(fields=['class_ref', 'optional_subject'], name='idx_omd_class_subject'),
        ]
    
    def clean(self):
        if self.full_marks < 0:
            raise ValidationError("Full marks cannot be negative")
    
    def __str__(self):
        return f"{self.class_ref.name} - {self.optional_subject.name} - {self.assessment_category.name}: {self.full_marks}"
