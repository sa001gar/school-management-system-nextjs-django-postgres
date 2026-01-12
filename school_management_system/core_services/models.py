"""
Core Services Models - Central data models for the school management system.
Contains Students, Classes, Sections, Sessions, Teachers, Admins, and related configurations.
"""
import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone


class CustomUser(AbstractUser):
    """Extended User model for authentication."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    
    # User role field
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('teacher', 'Teacher'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='teacher')
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def __str__(self):
        return f"{self.email} ({self.role})"


class Admin(models.Model):
    """Admin profile linked to user."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='admin_profile')
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'admins'
        verbose_name = 'Admin'
        verbose_name_plural = 'Admins'
    
    @property
    def email(self):
        return self.user.email
    
    def __str__(self):
        return f"{self.name} ({self.email})"


class Teacher(models.Model):
    """Teacher profile linked to user."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='teacher_profile')
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'teachers'
        verbose_name = 'Teacher'
        verbose_name_plural = 'Teachers'
    
    @property
    def email(self):
        return self.user.email
    
    def __str__(self):
        return f"{self.name} ({self.email})"


class Session(models.Model):
    """Academic session/year."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'sessions'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name


class Class(models.Model):
    """School class/grade."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    level = models.IntegerField(default=0, help_text="Numeric level for ordering")
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'classes'
        verbose_name = 'Class'
        verbose_name_plural = 'Classes'
        ordering = ['level']
    
    def __str__(self):
        return self.name


class Section(models.Model):
    """Class section (e.g., A, B, C)."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50)
    class_ref = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='sections', db_column='class_id')
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'sections'
        ordering = ['name']
    
    def __str__(self):
        return f"{self.class_ref.name} - {self.name}"


class Subject(models.Model):
    """Academic subject."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)
    full_marks = models.IntegerField(default=100)
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'subjects'
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.code})"


class CocurricularSubject(models.Model):
    """Co-curricular activity subject."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'cocurricular_subjects'
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.code})"


class OptionalSubject(models.Model):
    """Optional subject."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)
    default_full_marks = models.IntegerField(default=50)
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'optional_subjects'
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.code})"


class ClassSubjectAssignment(models.Model):
    """Assignment of subjects to classes."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    class_ref = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='subject_assignments', db_column='class_id')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='class_assignments')
    is_required = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'class_subject_assignments'
        unique_together = ['class_ref', 'subject']
    
    def __str__(self):
        return f"{self.class_ref.name} - {self.subject.name}"


class ClassOptionalConfig(models.Model):
    """Configuration for optional subjects per class."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    class_ref = models.OneToOneField(Class, on_delete=models.CASCADE, related_name='optional_config', db_column='class_id')
    has_optional = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'class_optional_config'
    
    def __str__(self):
        return f"{self.class_ref.name} - Optional: {self.has_optional}"


class ClassOptionalAssignment(models.Model):
    """Assignment of optional subjects to classes."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    class_ref = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='optional_assignments', db_column='class_id')
    optional_subject = models.ForeignKey(OptionalSubject, on_delete=models.CASCADE, related_name='class_assignments')
    full_marks = models.IntegerField(default=50)
    is_required = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'class_optional_assignments'
        unique_together = ['class_ref', 'optional_subject']
    
    def __str__(self):
        return f"{self.class_ref.name} - {self.optional_subject.name}"


class ClassCocurricularConfig(models.Model):
    """Configuration for co-curricular activities per class."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    class_ref = models.OneToOneField(Class, on_delete=models.CASCADE, related_name='cocurricular_config', db_column='class_id')
    has_cocurricular = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'class_cocurricular_config'
    
    def __str__(self):
        return f"{self.class_ref.name} - Cocurricular: {self.has_cocurricular}"


class ClassMarksDistribution(models.Model):
    """Marks distribution configuration per class."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    class_ref = models.OneToOneField(Class, on_delete=models.CASCADE, related_name='marks_distribution', db_column='class_id')
    first_summative_marks = models.IntegerField(default=40)
    first_formative_marks = models.IntegerField(default=10)
    second_summative_marks = models.IntegerField(default=40)
    second_formative_marks = models.IntegerField(default=10)
    third_summative_marks = models.IntegerField(default=40)
    third_formative_marks = models.IntegerField(default=10)
    number_of_unit_tests = models.IntegerField(default=3)
    has_final_term = models.BooleanField(default=True)
    unit_test_marks = models.IntegerField(default=40)
    formative_marks = models.IntegerField(default=10)
    final_term_marks = models.IntegerField(default=40)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'class_marks_distribution'
    
    @property
    def total_marks(self):
        return (
            self.first_summative_marks + self.first_formative_marks +
            self.second_summative_marks + self.second_formative_marks +
            self.third_summative_marks + self.third_formative_marks
        )
    
    def __str__(self):
        return f"{self.class_ref.name} - Total: {self.total_marks}"


class SchoolConfig(models.Model):
    """School configuration per class and session."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    class_ref = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='school_configs', db_column='class_id', null=True, blank=True)
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='school_configs', null=True, blank=True)
    total_school_days = models.IntegerField(default=200)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'school_config'
    
    def __str__(self):
        class_name = self.class_ref.name if self.class_ref else "Global"
        session_name = self.session.name if self.session else "All Sessions"
        return f"{class_name} - {session_name} - {self.total_school_days} days"


class Student(models.Model):
    """Student information."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    roll_no = models.CharField(max_length=50)
    name = models.CharField(max_length=255)
    class_ref = models.ForeignKey(Class, on_delete=models.SET_NULL, null=True, related_name='students', db_column='class_id')
    section = models.ForeignKey(Section, on_delete=models.SET_NULL, null=True, related_name='students')
    session = models.ForeignKey(Session, on_delete=models.SET_NULL, null=True, related_name='students')
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'students'
        ordering = ['roll_no']
    
    def __str__(self):
        return f"{self.roll_no} - {self.name}"
