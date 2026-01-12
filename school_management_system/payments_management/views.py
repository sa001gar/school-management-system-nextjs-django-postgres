"""
Views for Payments Management API.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Sum
from django.utils import timezone

from .models import FeeStructure, FeeDiscount, StudentFee, Payment, PaymentReminder
from .serializers import (
    FeeStructureSerializer, FeeStructureCreateSerializer, FeeStructureDetailSerializer,
    FeeDiscountSerializer,
    StudentFeeSerializer, StudentFeeCreateSerializer, StudentFeeDetailSerializer,
    PaymentSerializer, PaymentCreateSerializer, PaymentDetailSerializer,
    PaymentReminderSerializer, PaymentReminderCreateSerializer
)
from core_services.views import IsAdminUser


class FeeStructureViewSet(viewsets.ModelViewSet):
    """ViewSet for fee structures."""
    queryset = FeeStructure.objects.all()
    serializer_class = FeeStructureSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['class_ref', 'session', 'is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    permission_classes = [IsAdminUser]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return FeeStructureDetailSerializer
        if self.action == 'create':
            return FeeStructureCreateSerializer
        return FeeStructureSerializer
    
    def get_queryset(self):
        queryset = FeeStructure.objects.select_related('class_ref', 'session')
        class_id = self.request.query_params.get('class_id')
        session_id = self.request.query_params.get('session_id')
        
        if class_id:
            queryset = queryset.filter(class_ref_id=class_id)
        if session_id:
            queryset = queryset.filter(session_id=session_id)
        
        return queryset


class FeeDiscountViewSet(viewsets.ModelViewSet):
    """ViewSet for fee discounts."""
    queryset = FeeDiscount.objects.all()
    serializer_class = FeeDiscountSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['discount_type', 'is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    permission_classes = [IsAdminUser]


class StudentFeeViewSet(viewsets.ModelViewSet):
    """ViewSet for student fees."""
    queryset = StudentFee.objects.all()
    serializer_class = StudentFeeSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['student', 'fee_structure', 'session', 'status']
    search_fields = ['student__name', 'student__roll_no']
    ordering_fields = ['due_date', 'net_amount', 'created_at']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return StudentFeeDetailSerializer
        if self.action == 'create':
            return StudentFeeCreateSerializer
        return StudentFeeSerializer
    
    def get_queryset(self):
        queryset = StudentFee.objects.select_related(
            'student', 'fee_structure', 'session', 'discount'
        )
        student_id = self.request.query_params.get('student_id')
        session_id = self.request.query_params.get('session_id')
        status_filter = self.request.query_params.get('status')
        
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        if session_id:
            queryset = queryset.filter(session_id=session_id)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticated()]
    
    @action(detail=False, methods=['get'], url_path='summary')
    def fee_summary(self, request):
        """Get fee collection summary."""
        session_id = request.query_params.get('session_id')
        class_id = request.query_params.get('class_id')
        
        queryset = self.get_queryset()
        if session_id:
            queryset = queryset.filter(session_id=session_id)
        if class_id:
            queryset = queryset.filter(student__class_ref_id=class_id)
        
        summary = queryset.aggregate(
            total_net=Sum('net_amount'),
            total_paid=Sum('paid_amount'),
        )
        
        total_net = summary['total_net'] or 0
        total_paid = summary['total_paid'] or 0
        total_pending = total_net - total_paid
        
        status_counts = {
            'paid': queryset.filter(status='paid').count(),
            'partial': queryset.filter(status='partial').count(),
            'pending': queryset.filter(status='pending').count(),
            'overdue': queryset.filter(status='overdue').count(),
            'waived': queryset.filter(status='waived').count(),
        }
        
        return Response({
            'total_students': queryset.count(),
            'total_net_amount': float(total_net),
            'total_paid_amount': float(total_paid),
            'total_pending_amount': float(total_pending),
            'collection_percentage': round((total_paid / total_net * 100) if total_net > 0 else 0, 2),
            'status_counts': status_counts
        })
    
    @action(detail=True, methods=['post'], url_path='waive')
    def waive_fee(self, request, pk=None):
        """Waive student fee."""
        student_fee = self.get_object()
        student_fee.status = 'waived'
        student_fee.save()
        return Response(StudentFeeDetailSerializer(student_fee).data)
    
    @action(detail=False, methods=['get'], url_path='overdue')
    def overdue_fees(self, request):
        """Get all overdue fees."""
        today = timezone.now().date()
        queryset = self.get_queryset().filter(
            due_date__lt=today,
            status__in=['pending', 'partial']
        )
        
        # Update status to overdue
        queryset.update(status='overdue')
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = StudentFeeDetailSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = StudentFeeDetailSerializer(queryset, many=True)
        return Response(serializer.data)


class PaymentViewSet(viewsets.ModelViewSet):
    """ViewSet for payments."""
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['student_fee', 'payment_method']
    search_fields = ['receipt_number', 'transaction_id', 'student_fee__student__name']
    ordering_fields = ['payment_date', 'amount', 'created_at']
    ordering = ['-payment_date', '-created_at']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return PaymentDetailSerializer
        if self.action == 'create':
            return PaymentCreateSerializer
        return PaymentSerializer
    
    def get_queryset(self):
        queryset = Payment.objects.select_related(
            'student_fee__student', 'student_fee__fee_structure', 'received_by'
        )
        student_fee_id = self.request.query_params.get('student_fee_id')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        
        if student_fee_id:
            queryset = queryset.filter(student_fee_id=student_fee_id)
        if date_from:
            queryset = queryset.filter(payment_date__gte=date_from)
        if date_to:
            queryset = queryset.filter(payment_date__lte=date_to)
        
        return queryset
    
    @action(detail=False, methods=['get'], url_path='daily-collection')
    def daily_collection(self, request):
        """Get daily collection report."""
        date = request.query_params.get('date', timezone.now().date())
        
        payments = Payment.objects.filter(payment_date=date)
        
        total_collection = payments.aggregate(total=Sum('amount'))['total'] or 0
        
        by_method = {}
        for method, label in Payment.PAYMENT_METHOD_CHOICES:
            method_total = payments.filter(payment_method=method).aggregate(
                total=Sum('amount')
            )['total'] or 0
            by_method[method] = float(method_total)
        
        return Response({
            'date': str(date),
            'total_collection': float(total_collection),
            'total_transactions': payments.count(),
            'by_payment_method': by_method
        })


class PaymentReminderViewSet(viewsets.ModelViewSet):
    """ViewSet for payment reminders."""
    queryset = PaymentReminder.objects.all()
    serializer_class = PaymentReminderSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['student_fee', 'status']
    ordering_fields = ['reminder_date', 'created_at']
    ordering = ['-reminder_date']
    permission_classes = [IsAdminUser]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return PaymentReminderCreateSerializer
        return PaymentReminderSerializer
    
    @action(detail=True, methods=['post'], url_path='send')
    def send_reminder(self, request, pk=None):
        """Mark reminder as sent."""
        reminder = self.get_object()
        reminder.status = 'sent'
        reminder.sent_at = timezone.now()
        reminder.save()
        return Response(PaymentReminderSerializer(reminder).data)
    
    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel_reminder(self, request, pk=None):
        """Cancel reminder."""
        reminder = self.get_object()
        reminder.status = 'cancelled'
        reminder.save()
        return Response(PaymentReminderSerializer(reminder).data)
