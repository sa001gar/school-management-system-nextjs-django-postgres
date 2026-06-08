from django.contrib import admin
from .models import StudentResult, StudentCocurricularResult, StudentOptionalResult


@admin.register(StudentResult)
class StudentResultAdmin(admin.ModelAdmin):
    list_display = ('student', 'subject', 'session', 'total_marks', 'grade', 'school')
    list_filter = ('school', 'session', 'grade')
    search_fields = ('student__name', 'student__roll_no', 'subject__name')


@admin.register(StudentCocurricularResult)
class StudentCocurricularResultAdmin(admin.ModelAdmin):
    list_display = ('student', 'cocurricular_subject', 'session', 'overall_grade', 'school')
    list_filter = ('school', 'session', 'overall_grade')
    search_fields = ('student__name', 'student__roll_no')


@admin.register(StudentOptionalResult)
class StudentOptionalResultAdmin(admin.ModelAdmin):
    list_display = ('student', 'optional_subject', 'session', 'obtained_marks', 'grade', 'school')
    list_filter = ('school', 'session', 'grade')
    search_fields = ('student__name', 'student__roll_no')
