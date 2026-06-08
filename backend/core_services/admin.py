from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    CustomUser, Admin as AdminProfile, Teacher, Session, Class, Section,
    Subject, CocurricularSubject, OptionalSubject, ClassSubjectAssignment,
    ClassOptionalConfig, ClassOptionalAssignment, ClassCocurricularConfig,
    ClassMarksDistribution, SchoolConfig, Student, School,
    AssessmentCategory, CoreSubjectMarksDistribution,
    CocurricularMarksDistribution, OptionalMarksDistribution
)



class SchoolScopedAdminMixin:
    """
    Mixin to restrict admin view to user's school and auto-assign school on save.
    Site admins see all.
    """
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser or request.user.role == 'site_admin':
            return qs
        if request.user.school:
            return qs.filter(school=request.user.school)
        return qs.none()

    def save_model(self, request, obj, form, change):
        if not request.user.is_superuser and request.user.role != 'site_admin':
            if not obj.school:
                obj.school = request.user.school
        super().save_model(request, obj, form, change)

    def get_list_filter(self, request):
        # Remove 'school' filter for school admins as they only see their own
        if not request.user.is_superuser and request.user.role != 'site_admin':
            return [f for f in super().get_list_filter(request) if f != 'school']
        return super().get_list_filter(request)

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        # Hide school field for school admins
        if not request.user.is_superuser and request.user.role != 'site_admin':
            if 'school' in form.base_fields:
                form.base_fields['school'].widget = admin.widgets.HiddenInput()
                form.base_fields['school'].required = False
        return form


@admin.register(CustomUser)
class CustomUserAdmin(SchoolScopedAdminMixin, UserAdmin):
    list_display = ('email', 'username', 'role', 'school', 'is_active', 'is_staff')
    list_filter = ('role', 'school', 'is_active', 'is_staff')
    search_fields = ('email', 'username')
    ordering = ('email',)
    fieldsets = UserAdmin.fieldsets + (
        ('Role Information', {'fields': ('role',)}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Role Information', {'fields': ('email', 'role', 'school')}),
    )
    
    
@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'city', 'email')
    search_fields = ('name', 'code')


@admin.register(AdminProfile)
class AdminProfileAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'created_at')
    search_fields = ('name', 'user__email')


@admin.register(Teacher)
class TeacherAdmin(SchoolScopedAdminMixin, admin.ModelAdmin):
    list_display = ('name', 'email', 'school', 'created_at')
    list_filter = ('school',)
    search_fields = ('name', 'user__email')


@admin.register(Session)
class SessionAdmin(SchoolScopedAdminMixin, admin.ModelAdmin):
    list_display = ('name', 'start_date', 'end_date', 'school', 'is_active')
    list_filter = ('school', 'is_active')
    search_fields = ('name',)


@admin.register(Class)
class ClassAdmin(SchoolScopedAdminMixin, admin.ModelAdmin):
    list_display = ('name', 'level', 'school', 'created_at')
    list_filter = ('school',)
    ordering = ('level',)


@admin.register(Section)
class SectionAdmin(admin.ModelAdmin):
    list_display = ('name', 'class_ref', 'created_at')
    list_filter = ('class_ref',)


@admin.register(Subject)
class SubjectAdmin(SchoolScopedAdminMixin, admin.ModelAdmin):
    list_display = ('name', 'code', 'school', 'full_marks')
    list_filter = ('school',)
    search_fields = ('name', 'code')


@admin.register(CocurricularSubject)
class CocurricularSubjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'code')
    search_fields = ('name', 'code')


@admin.register(OptionalSubject)
class OptionalSubjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'default_full_marks')
    search_fields = ('name', 'code')


@admin.register(ClassSubjectAssignment)
class ClassSubjectAssignmentAdmin(admin.ModelAdmin):
    list_display = ('class_ref', 'subject', 'is_required')
    list_filter = ('class_ref', 'is_required')


@admin.register(ClassOptionalConfig)
class ClassOptionalConfigAdmin(admin.ModelAdmin):
    list_display = ('class_ref', 'has_optional')


@admin.register(ClassOptionalAssignment)
class ClassOptionalAssignmentAdmin(admin.ModelAdmin):
    list_display = ('class_ref', 'optional_subject', 'full_marks')


@admin.register(ClassCocurricularConfig)
class ClassCocurricularConfigAdmin(admin.ModelAdmin):
    list_display = ('class_ref', 'has_cocurricular')


@admin.register(ClassMarksDistribution)
class ClassMarksDistributionAdmin(admin.ModelAdmin):
    list_display = ('class_ref', 'total_marks')


@admin.register(SchoolConfig)
class SchoolConfigAdmin(admin.ModelAdmin):
    list_display = ('class_ref', 'session', 'total_school_days')


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('roll_no', 'name', 'class_ref', 'section', 'session', 'school')
    list_filter = ('school', 'class_ref', 'section', 'session')
    search_fields = ('name', 'roll_no')


# Dynamic Marks Distribution Admin
@admin.register(AssessmentCategory)
class AssessmentCategoryAdmin(SchoolScopedAdminMixin, admin.ModelAdmin):
    list_display = ('name', 'code', 'category_type', 'display_order', 'school', 'is_active')
    list_filter = ('school', 'category_type', 'is_active')
    search_fields = ('name', 'code')
    ordering = ('display_order', 'name')


@admin.register(CoreSubjectMarksDistribution)
class CoreSubjectMarksDistributionAdmin(admin.ModelAdmin):
    list_display = ('class_ref', 'assessment_category', 'full_marks')
    list_filter = ('class_ref', 'assessment_category')


@admin.register(CocurricularMarksDistribution)
class CocurricularMarksDistributionAdmin(admin.ModelAdmin):
    list_display = ('class_ref', 'cocurricular_subject', 'assessment_category', 'full_marks')
    list_filter = ('class_ref', 'cocurricular_subject')


@admin.register(OptionalMarksDistribution)
class OptionalMarksDistributionAdmin(admin.ModelAdmin):
    list_display = ('class_ref', 'optional_subject', 'assessment_category', 'full_marks')
    list_filter = ('class_ref', 'optional_subject')
