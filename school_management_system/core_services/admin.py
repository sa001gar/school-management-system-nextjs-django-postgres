from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    CustomUser, Admin as AdminProfile, Teacher, Session, Class, Section,
    Subject, CocurricularSubject, OptionalSubject, ClassSubjectAssignment,
    ClassOptionalConfig, ClassOptionalAssignment, ClassCocurricularConfig,
    ClassMarksDistribution, SchoolConfig, Student
)


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'username', 'role', 'is_active', 'is_staff')
    list_filter = ('role', 'is_active', 'is_staff')
    search_fields = ('email', 'username')
    ordering = ('email',)
    fieldsets = UserAdmin.fieldsets + (
        ('Role Information', {'fields': ('role',)}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Role Information', {'fields': ('email', 'role',)}),
    )


@admin.register(AdminProfile)
class AdminProfileAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'created_at')
    search_fields = ('name', 'user__email')


@admin.register(Teacher)
class TeacherAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'created_at')
    search_fields = ('name', 'user__email')


@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = ('name', 'start_date', 'end_date', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name',)


@admin.register(Class)
class ClassAdmin(admin.ModelAdmin):
    list_display = ('name', 'level', 'created_at')
    ordering = ('level',)


@admin.register(Section)
class SectionAdmin(admin.ModelAdmin):
    list_display = ('name', 'class_ref', 'created_at')
    list_filter = ('class_ref',)


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'full_marks')
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
    list_display = ('roll_no', 'name', 'class_ref', 'section', 'session')
    list_filter = ('class_ref', 'section', 'session')
    search_fields = ('name', 'roll_no')
