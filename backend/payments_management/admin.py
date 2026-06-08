from django.contrib import admin
from .models import FeeStructure, FeeDiscount, StudentFee, Payment, PaymentReminder


@admin.register(FeeStructure)
class FeeStructureAdmin(admin.ModelAdmin):
    list_display = ('name', 'class_ref', 'session', 'school', 'total_fee', 'is_active')
    list_filter = ('school', 'class_ref', 'session', 'is_active')
    search_fields = ('name',)


@admin.register(FeeDiscount)
class FeeDiscountAdmin(admin.ModelAdmin):
    list_display = ('name', 'discount_type', 'discount_value', 'school', 'is_active')
    list_filter = ('school', 'discount_type', 'is_active')


@admin.register(StudentFee)
class StudentFeeAdmin(admin.ModelAdmin):
    list_display = ('student', 'fee_structure', 'net_amount', 'paid_amount', 'school', 'status')
    list_filter = ('school', 'status', 'session')
    search_fields = ('student__name', 'student__roll_no')


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('receipt_number', 'student_fee', 'amount', 'payment_method', 'payment_date', 'school')
    list_filter = ('school', 'payment_method', 'payment_date')
    search_fields = ('receipt_number', 'student_fee__student__name')


@admin.register(PaymentReminder)
class PaymentReminderAdmin(admin.ModelAdmin):
    list_display = ('student_fee', 'reminder_date', 'school', 'status')
    list_filter = ('school', 'status', 'reminder_date')
