"""
Core Services Models - Central data models for the school management system.
Contains Students, Classes, Sections, Sessions, Teachers, Admins, and related configurations.

System Philosophy:
- Permanent student identity with session-wise academic and financial records
- Historical immutability and strong data integrity
- Full auditability with session-based record management
"""
import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from django.core.exceptions import ValidationError


class School(models.Model):
    """School/Tenant in the multi-tenant SaaS system."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, unique=True, help_text="Short unique identifier for the school")
    logo = models.ImageField(upload_to='school_logos/', null=True, blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    pincode = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    alternate_phone = models.CharField(max_length=20, blank=True)
    website = models.URLField(blank=True)
    student_id_prefix = models.CharField(max_length=10, default='STU', help_text="Prefix for auto-generated student IDs")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'schools'
        ordering = ['name']
        verbose_name = 'School'
        verbose_name_plural = 'Schools'
    
    def __str__(self):
        return f"{self.name} ({self.code})"


class CustomUser(AbstractUser):
    """Extended User model for authentication."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    
    # User role field - 4 levels: site_admin, admin (school), teacher, student
    ROLE_CHOICES = [
        ('site_admin', 'Site Admin'),  # Super admin - manages all schools
        ('admin', 'Admin'),  # School admin - manages one school
        ('teacher', 'Teacher'),
        ('student', 'Student'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='teacher')
    
    # School association (null for site_admin)
    school = models.ForeignKey(
        School, on_delete=models.CASCADE, null=True, blank=True,
        related_name='users', help_text="School this user belongs to (null for site_admin)"
    )
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    @property
    def is_site_admin(self):
        return self.role == 'site_admin'
    
    @property
    def is_admin(self):
        return self.role == 'admin'
    
    @property
    def is_teacher(self):
        return self.role == 'teacher'
    
    @property
    def is_student(self):
        return self.role == 'student'
    
    def __str__(self):
        school_name = self.school.code if self.school else 'Site'
        return f"{self.email} ({self.role}@{school_name})"


class Admin(models.Model):
    """Admin profile linked to user. Each admin manages one school."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='admin_profile')
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='admins', null=True, blank=True)
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
        school_code = self.school.code if self.school else 'No School'
        return f"{self.name} ({self.email}) - {school_code}"
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Sync school to user if set
        if self.school and self.user.school != self.school:
            self.user.school = self.school
            self.user.save()


class Teacher(models.Model):
    """Teacher profile linked to user. Each teacher belongs to one school."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='teacher_profile')
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='teachers', null=True, blank=True)
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
        school_code = self.school.code if self.school else 'No School'
        return f"{self.name} ({self.email}) - {school_code}"
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Sync school to user if set
        if self.school and self.user.school != self.school:
            self.user.school = self.school
            self.user.save()


class Session(models.Model):
    """
    Academic session/year per school.
    
    Session-Based Data Integrity:
    - Every academic and financial record is attached to a session
    - When a session ends, data is locked (is_locked=True)
    - New session enrollment is created for promoted students
    - Historical data remains immutable
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='sessions', null=True, blank=True)
    name = models.CharField(max_length=100)
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=False)
    is_locked = models.BooleanField(default=False, help_text="When locked, no academic/financial changes allowed")
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'sessions'
        ordering = ['-start_date']
        unique_together = ['school', 'name']  # Session name unique per school
        indexes = [
            models.Index(
                fields=['is_active'],
                name='idx_session_active',
                condition=models.Q(is_active=True)
            ),
            models.Index(fields=['school', 'is_active'], name='idx_session_school_active'),
        ]
    
    def clean(self):
        if self.end_date <= self.start_date:
            raise ValidationError("End date must be after start date")
    
    def lock_session(self):
        """Lock the session preventing any further modifications"""
        self.is_locked = True
        self.is_active = False
        self.save()
    
    def __str__(self):
        school_code = self.school.code if self.school else 'Global'
        return f"{school_code} - {self.name}"


class Class(models.Model):
    """School class/grade per school."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='classes', null=True, blank=True)
    name = models.CharField(max_length=100)
    level = models.IntegerField(default=0, help_text="Numeric level for ordering")
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'classes'
        verbose_name = 'Class'
        verbose_name_plural = 'Classes'
        ordering = ['level']
        unique_together = ['school', 'name']  # Class name unique per school
    
    def __str__(self):
        school_code = self.school.code if self.school else 'Global'
        return f"{school_code} - {self.name}"


class Section(models.Model):
    """Class section (e.g., A, B, C)."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50)
    class_ref = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='sections', db_column='class_id')
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'sections'
        ordering = ['name']
        indexes = [
            models.Index(fields=['class_ref', 'name'], name='idx_section_class_name'),
        ]
    
    def __str__(self):
        return f"{self.class_ref.name} - {self.name}"


class Subject(models.Model):
    """Academic subject per school."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='subjects', null=True, blank=True)
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20)  # Unique per school, not globally
    full_marks = models.IntegerField(default=100)
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'subjects'
        ordering = ['name']
        unique_together = ['school', 'code']  # Subject code unique per school
    
    def __str__(self):
        return f"{self.name} ({self.code})"


class CocurricularSubject(models.Model):
    """Co-curricular activity subject per school."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='cocurricular_subjects', null=True, blank=True)
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20)  # Unique per school
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'cocurricular_subjects'
        ordering = ['name']
        unique_together = ['school', 'code']
    
    def __str__(self):
        return f"{self.name} ({self.code})"


class OptionalSubject(models.Model):
    """Optional subject per school."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='optional_subjects', null=True, blank=True)
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20)  # Unique per school
    default_full_marks = models.IntegerField(default=50)
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'optional_subjects'
        ordering = ['name']
        unique_together = ['school', 'code']
    
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
        ordering = ['created_at']
    
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
        indexes = [
            models.Index(fields=['class_ref', 'session'], name='idx_schoolconfig_class_session'),
        ]
    
    def __str__(self):
        class_name = self.class_ref.name if self.class_ref else "Global"
        session_name = self.session.name if self.session else "All Sessions"
        return f"{class_name} - {session_name} - {self.total_school_days} days"


class Student(models.Model):
    """
    Permanent Student Identity per school.
    
    The student identity never changes; only session enrollments evolve.
    This model stores the permanent student information.
    Session-specific data (class, section, roll number) is in StudentEnrollment.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='students', null=True, blank=True)
    student_id = models.CharField(max_length=50, help_text="Permanent unique student identifier per school")
    
    # Personal Information (Permanent)
    name = models.CharField(max_length=255)
    date_of_birth = models.DateField(null=True, blank=True)
    father_name = models.CharField(max_length=255, blank=True)
    mother_name = models.CharField(max_length=255, blank=True)
    guardian_name = models.CharField(max_length=255, blank=True)
    guardian_relation = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    alternate_phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True, null=True)
    profile_pic = models.ImageField(upload_to='student_photos/', null=True, blank=True)
    address = models.TextField(blank=True)
    
    # Admission Info
    admission_date = models.DateField(null=True, blank=True)
    admission_class = models.ForeignKey(
        Class, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='admitted_students', db_column='admission_class_id'
    )
    admission_session = models.ForeignKey(
        Session, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='admitted_students', db_column='admission_session_id'
    )
    
    # Legacy fields for backward compatibility (will be migrated to enrollments)
    roll_no = models.CharField(max_length=50, blank=True)
    class_ref = models.ForeignKey(Class, on_delete=models.SET_NULL, null=True, blank=True, related_name='students', db_column='class_id')
    section = models.ForeignKey(Section, on_delete=models.SET_NULL, null=True, blank=True, related_name='students')
    session = models.ForeignKey(Session, on_delete=models.SET_NULL, null=True, blank=True, related_name='students')
    
    # Authentication for student portal
    password_hash = models.CharField(max_length=128, blank=True)
    
    # Status
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'students'
        ordering = ['name']
        unique_together = ['school', 'student_id']  # Student ID unique per school
        indexes = [
            models.Index(fields=['school', 'student_id'], name='idx_stu_school_student_id'),
            models.Index(fields=['session', 'class_ref', 'section'], name='idx_stu_sess_cls_sec'),
            models.Index(fields=['class_ref', 'section'], name='idx_stu_cls_sec'),
            models.Index(fields=['name'], name='idx_stu_name'),
            models.Index(fields=['class_ref', 'roll_no'], name='idx_stu_cls_roll'),
            models.Index(fields=['admission_session'], name='idx_stu_admission_sess'),
        ]
    
    def set_password(self, raw_password):
        """Hash and set the password."""
        from django.contrib.auth.hashers import make_password
        self.password_hash = make_password(raw_password)
    
    def check_password(self, raw_password):
        """Check the password against the stored hash."""
        from django.contrib.auth.hashers import check_password
        return check_password(raw_password, self.password_hash)
    
    def set_default_password(self):
        """Set default password as DOB in DDMMYYYY format."""
        if self.date_of_birth:
            default_pwd = self.date_of_birth.strftime('%d%m%Y')
            self.set_password(default_pwd)
    
    def get_current_enrollment(self):
        """Get the current active session enrollment."""
        return self.enrollments.filter(session__is_active=True).first()
    
    def get_enrollment_for_session(self, session):
        """Get enrollment for a specific session."""
        return self.enrollments.filter(session=session).first()
    
    @staticmethod
    def generate_student_id(prefix='STU', year=None):
        """Generate a unique student ID with format: PREFIX_YEAR_XXXXXX"""
        import secrets
        import string
        from django.utils import timezone
        
        if year is None:
            year = timezone.now().year
        
        # Generate 6-character alphanumeric suffix
        alphabet = string.ascii_uppercase + string.digits
        suffix = ''.join(secrets.choice(alphabet) for _ in range(6))
        
        return f"{prefix}_{year}_{suffix}"
    
    def save(self, *args, **kwargs):
        # Auto-generate student_id if not provided
        if not self.student_id:
            # Use school defined prefix if available, else school code, else 'STU'
            if self.school and self.school.student_id_prefix:
                prefix = self.school.student_id_prefix
            else:
                prefix = self.school.code if self.school else 'STU'
            
            year = self.admission_session.start_date.year if self.admission_session else timezone.now().year
            self.student_id = self.generate_student_id(prefix=prefix, year=year)
        
        # Set default password if not set and DOB is available
        if not self.password_hash and self.date_of_birth:
            self.set_default_password()
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.student_id} - {self.name}"


class StudentEnrollment(models.Model):
    """
    Session-wise Student Enrollment.
    
    Each student has one enrollment record per session.
    This tracks their class, section, roll number, and status for that session.
    Historical enrollments remain immutable for audit purposes.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='enrollments')
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='enrollments')
    class_ref = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='enrollments', db_column='class_id')
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name='enrollments')
    roll_no = models.CharField(max_length=50)
    
    # Enrollment Status
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('promoted', 'Promoted'),
        ('retained', 'Retained'),
        ('transferred', 'Transferred Out'),
        ('graduated', 'Graduated'),
        ('dropped', 'Dropped Out'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    # Tracking
    promoted_to = models.ForeignKey(
        'self', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='promoted_from_enrollment'
    )
    promotion_date = models.DateField(null=True, blank=True)
    remarks = models.TextField(blank=True)
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'student_enrollments'
        unique_together = ['student', 'session']
        ordering = ['-session__start_date', 'roll_no']
        indexes = [
            models.Index(fields=['session', 'class_ref', 'section'], name='idx_enroll_sess_cls_sec'),
            models.Index(fields=['student', 'session'], name='idx_enroll_stu_sess'),
            models.Index(fields=['status'], name='idx_enroll_status'),
        ]
    
    def clean(self):
        # Validate section belongs to class
        if self.section and self.class_ref:
            if self.section.class_ref_id != self.class_ref_id:
                raise ValidationError("Section must belong to the selected class")
        
        # Prevent modification of locked sessions
        if self.session and self.session.is_locked and self.pk:
            # Only allow status changes for locked sessions
            pass
    
    def promote_to_next_class(self, new_class, new_section, new_session, new_roll_no):
        """Promote student to next class/session."""
        if self.status != 'active':
            raise ValidationError("Only active students can be promoted")
        
        # Create new enrollment
        new_enrollment = StudentEnrollment.objects.create(
            student=self.student,
            session=new_session,
            class_ref=new_class,
            section=new_section,
            roll_no=new_roll_no,
            status='active'
        )
        
        # Update current enrollment
        self.status = 'promoted'
        self.promoted_to = new_enrollment
        self.promotion_date = timezone.now().date()
        self.save()
        
        # Update student's current class info
        self.student.class_ref = new_class
        self.student.section = new_section
        self.student.session = new_session
        self.student.roll_no = new_roll_no
        self.student.save()
        
        return new_enrollment
    
    def retain_in_same_class(self, new_session, new_roll_no=None):
        """Retain student in the same class for next session."""
        new_enrollment = StudentEnrollment.objects.create(
            student=self.student,
            session=new_session,
            class_ref=self.class_ref,
            section=self.section,
            roll_no=new_roll_no or self.roll_no,
            status='active'
        )
        
        self.status = 'retained'
        self.save()
        
        return new_enrollment
    
    def transfer_out(self, remarks=''):
        """Mark student as transferred out."""
        self.status = 'transferred'
        self.remarks = remarks
        self.save()
        
        self.student.is_active = False
        self.student.save()
    
    def __str__(self):
        return f"{self.student.name} - {self.class_ref.name} {self.section.name} ({self.session.name})"


class ClassTeacher(models.Model):
    """
    Class Teacher Assignment.
    
    Designates a teacher as the class teacher for a specific class/section/session.
    Class teachers can generate marksheets for their class.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='class_teacher_assignments')
    class_ref = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='class_teachers', db_column='class_id')
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name='class_teachers')
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='class_teachers')
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'class_teachers'
        unique_together = ['class_ref', 'section', 'session']
        indexes = [
            models.Index(fields=['teacher', 'session'], name='idx_ct_teacher_session'),
            models.Index(fields=['class_ref', 'section', 'session'], name='idx_ct_cls_sec_sess'),
        ]
    
    def __str__(self):
        return f"{self.teacher.name} - {self.class_ref.name} {self.section.name} ({self.session.name})"


class TeacherAssignment(models.Model):
    """
    Assignment of teachers to class-section-subject combinations.
    
    Authorization Rule:
    Only the assigned subject teacher may enter marks for that subject.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='assignments')
    class_ref = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='teacher_assignments', db_column='class_id')
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name='teacher_assignments')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='teacher_assignments')
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='teacher_assignments')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'teacher_assignments'
        unique_together = ['teacher', 'class_ref', 'section', 'subject', 'session']
        indexes = [
            models.Index(fields=['teacher', 'session'], name='idx_ta_teacher_session'),
            models.Index(fields=['class_ref', 'section', 'session'], name='idx_ta_cls_sec_session'),
            models.Index(fields=['class_ref', 'section', 'subject', 'session'], name='idx_ta_cls_sec_sub_sess'),
        ]
    
    def __str__(self):
        return f"{self.teacher.name} - {self.class_ref.name} {self.section.name} - {self.subject.name}"


class CocurricularTeacherAssignment(models.Model):
    """Assignment of teachers to cocurricular subjects for a class/section."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='cocurricular_assignments')
    class_ref = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='cocurricular_teacher_assignments', db_column='class_id')
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name='cocurricular_teacher_assignments')
    cocurricular_subject = models.ForeignKey(CocurricularSubject, on_delete=models.CASCADE, related_name='teacher_assignments')
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='cocurricular_teacher_assignments')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'cocurricular_teacher_assignments'
        unique_together = ['class_ref', 'section', 'cocurricular_subject', 'session']
        indexes = [
            models.Index(fields=['teacher', 'session'], name='idx_cta_teacher_session'),
        ]
    
    def __str__(self):
        return f"{self.teacher.name} - {self.cocurricular_subject.name} ({self.class_ref.name} {self.section.name})"


class OptionalTeacherAssignment(models.Model):
    """Assignment of teachers to optional subjects for a class/section."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='optional_assignments')
    class_ref = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='optional_teacher_assignments', db_column='class_id')
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name='optional_teacher_assignments')
    optional_subject = models.ForeignKey(OptionalSubject, on_delete=models.CASCADE, related_name='teacher_assignments')
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='optional_teacher_assignments')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'optional_teacher_assignments'
        unique_together = ['class_ref', 'section', 'optional_subject', 'session']
        indexes = [
            models.Index(fields=['teacher', 'session'], name='idx_ota_teacher_session'),
        ]
    
    def __str__(self):
        return f"{self.teacher.name} - {self.optional_subject.name} ({self.class_ref.name} {self.section.name})"


# Import dynamic marks distribution models
from .models_marks import (
    AssessmentCategory,
    CoreSubjectMarksDistribution,
    CocurricularMarksDistribution,
    OptionalMarksDistribution
)
