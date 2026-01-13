"""
Payments Management Models - Models for managing student fees and payments.
"""
import uuid
from django.db import models
from django.utils import timezone
from decimal import Decimal


class FeeStructure(models.Model):
    """Fee structure for different classes and categories."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    class_ref = models.ForeignKey(
        'core_services.Class', 
        on_delete=models.CASCADE, 
        related_name='fee_structures',
        db_column='class_id'
    )
    session = models.ForeignKey(
        'core_services.Session', 
        on_delete=models.CASCADE, 
        related_name='fee_structures'
    )
    
    # Fee breakdown
    tuition_fee = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    admission_fee = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    library_fee = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    lab_fee = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    sports_fee = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    exam_fee = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    miscellaneous_fee = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'fee_structures'
        ordering = ['class_ref__level', 'name']
        indexes = [
            # Composite index for class + session lookups
            models.Index(
                fields=['class_ref', 'session'],
                name='idx_feestructure_class_session'
            ),
            # Partial index for active fee structures
            models.Index(
                fields=['is_active'],
                name='idx_feestructure_active',
                condition=models.Q(is_active=True)
            ),
        ]
    
    @property
    def total_fee(self):
        return (
            self.tuition_fee + self.admission_fee + self.library_fee +
            self.lab_fee + self.sports_fee + self.exam_fee + self.miscellaneous_fee
        )
    
    def __str__(self):
        return f"{self.name} - {self.class_ref.name} ({self.session.name})"


class FeeDiscount(models.Model):
    """Discount types that can be applied to fees."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    
    DISCOUNT_TYPE_CHOICES = [
        ('percentage', 'Percentage'),
        ('fixed', 'Fixed Amount'),
    ]
    discount_type = models.CharField(max_length=20, choices=DISCOUNT_TYPE_CHOICES, default='percentage')
    discount_value = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'fee_discounts'
        ordering = ['name']
    
    def calculate_discount(self, amount):
        """Calculate discount amount based on type."""
        if self.discount_type == 'percentage':
            return (amount * self.discount_value) / 100
        return min(self.discount_value, amount)  # Fixed discount, but not more than amount
    
    def __str__(self):
        if self.discount_type == 'percentage':
            return f"{self.name} ({self.discount_value}%)"
        return f"{self.name} (₹{self.discount_value})"


class StudentFee(models.Model):
    """Fee assignment for individual students."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(
        'core_services.Student', 
        on_delete=models.CASCADE, 
        related_name='fees'
    )
    fee_structure = models.ForeignKey(
        FeeStructure, 
        on_delete=models.CASCADE, 
        related_name='student_fees'
    )
    session = models.ForeignKey(
        'core_services.Session', 
        on_delete=models.CASCADE, 
        related_name='student_fees'
    )
    
    # Optional discount
    discount = models.ForeignKey(
        FeeDiscount, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='student_fees'
    )
    
    # Amounts
    gross_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    net_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    paid_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    
    # Due date
    due_date = models.DateField(null=True, blank=True)
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('partial', 'Partially Paid'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
        ('waived', 'Waived'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'student_fees'
        ordering = ['-created_at']
        unique_together = ['student', 'fee_structure', 'session']
        indexes = [
            # Composite index for student + session
            models.Index(
                fields=['student', 'session'],
                name='idx_studentfee_student_session'
            ),
            # Index for status filtering (partial for unpaid)
            models.Index(
                fields=['status'],
                name='idx_studentfee_pending',
                condition=models.Q(status__in=['pending', 'partial', 'overdue'])
            ),
            # Index for due date queries
            models.Index(
                fields=['due_date', 'status'],
                name='idx_studentfee_duedate_status'
            ),
        ]
    
    @property
    def balance_amount(self):
        return self.net_amount - self.paid_amount
    
    def calculate_amounts(self):
        """Calculate gross, discount, and net amounts."""
        self.gross_amount = self.fee_structure.total_fee
        if self.discount:
            self.discount_amount = self.discount.calculate_discount(self.gross_amount)
        else:
            self.discount_amount = Decimal('0.00')
        self.net_amount = self.gross_amount - self.discount_amount
    
    def update_status(self):
        """Update status based on payment."""
        if self.paid_amount >= self.net_amount:
            self.status = 'paid'
        elif self.paid_amount > 0:
            self.status = 'partial'
        elif self.status != 'waived':
            self.status = 'pending'
    
    def save(self, *args, **kwargs):
        if not self.gross_amount:
            self.calculate_amounts()
        self.update_status()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.student.name} - {self.fee_structure.name} - {self.status}"


class Payment(models.Model):
    """Individual payment transaction."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student_fee = models.ForeignKey(
        StudentFee, 
        on_delete=models.CASCADE, 
        related_name='payments'
    )
    
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    PAYMENT_METHOD_CHOICES = [
        ('cash', 'Cash'),
        ('cheque', 'Cheque'),
        ('bank_transfer', 'Bank Transfer'),
        ('upi', 'UPI'),
        ('card', 'Debit/Credit Card'),
        ('other', 'Other'),
    ]
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='cash')
    
    # Transaction details
    transaction_id = models.CharField(max_length=100, blank=True, null=True)
    reference_number = models.CharField(max_length=100, blank=True, null=True)
    receipt_number = models.CharField(max_length=50, unique=True)
    
    # Payment date
    payment_date = models.DateField(default=timezone.now)
    
    remarks = models.TextField(blank=True, null=True)
    
    # Who received the payment
    received_by = models.ForeignKey(
        'core_services.CustomUser', 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='received_payments'
    )
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'payments'
        ordering = ['-payment_date', '-created_at']
        indexes = [
            # Index for payment date range queries
            models.Index(
                fields=['payment_date'],
                name='idx_payment_date'
            ),
            # Index for payment method reports
            models.Index(
                fields=['payment_method', 'payment_date'],
                name='idx_payment_method_date'
            ),
        ]
    
    def save(self, *args, **kwargs):
        # Generate receipt number if not provided
        if not self.receipt_number:
            import time
            self.receipt_number = f"RCP-{int(time.time() * 1000)}"
        super().save(*args, **kwargs)
        
        # Update student fee paid amount
        total_paid = self.student_fee.payments.aggregate(
            total=models.Sum('amount')
        )['total'] or Decimal('0.00')
        self.student_fee.paid_amount = total_paid
        self.student_fee.save()
    
    def __str__(self):
        return f"{self.receipt_number} - ₹{self.amount} - {self.payment_method}"


class PaymentReminder(models.Model):
    """Payment reminder for students with pending fees."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student_fee = models.ForeignKey(
        StudentFee, 
        on_delete=models.CASCADE, 
        related_name='reminders'
    )
    
    reminder_date = models.DateField()
    message = models.TextField()
    
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('sent', 'Sent'),
        ('cancelled', 'Cancelled'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    
    sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'payment_reminders'
        ordering = ['-reminder_date']
    
    def __str__(self):
        return f"Reminder for {self.student_fee.student.name} - {self.reminder_date}"
