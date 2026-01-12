"""
Serializers for Payments Management API.
"""
from rest_framework import serializers
from .models import FeeStructure, FeeDiscount, StudentFee, Payment, PaymentReminder
from core_services.serializers import StudentSerializer, ClassSerializer, SessionSerializer
from core_services.models import Student, Class, Session


class FeeStructureSerializer(serializers.ModelSerializer):
    """Serializer for fee structures."""
    class_id = serializers.UUIDField(source='class_ref.id', read_only=True)
    session_id = serializers.UUIDField(source='session.id', read_only=True)
    total_fee = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = FeeStructure
        fields = [
            'id', 'name', 'description', 'class_id', 'session_id',
            'tuition_fee', 'admission_fee', 'library_fee', 'lab_fee',
            'sports_fee', 'exam_fee', 'miscellaneous_fee',
            'total_fee', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class FeeStructureCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating fee structures."""
    class_id = serializers.UUIDField(write_only=True)
    session_id = serializers.UUIDField(write_only=True)
    
    class Meta:
        model = FeeStructure
        fields = [
            'id', 'name', 'description', 'class_id', 'session_id',
            'tuition_fee', 'admission_fee', 'library_fee', 'lab_fee',
            'sports_fee', 'exam_fee', 'miscellaneous_fee', 'is_active'
        ]
        read_only_fields = ['id']
    
    def create(self, validated_data):
        class_id = validated_data.pop('class_id')
        session_id = validated_data.pop('session_id')
        validated_data['class_ref'] = Class.objects.get(id=class_id)
        validated_data['session'] = Session.objects.get(id=session_id)
        return super().create(validated_data)


class FeeStructureDetailSerializer(FeeStructureSerializer):
    """Detailed fee structure serializer."""
    class_info = ClassSerializer(source='class_ref', read_only=True)
    session_info = SessionSerializer(source='session', read_only=True)
    
    class Meta(FeeStructureSerializer.Meta):
        fields = FeeStructureSerializer.Meta.fields + ['class_info', 'session_info']


class FeeDiscountSerializer(serializers.ModelSerializer):
    """Serializer for fee discounts."""
    class Meta:
        model = FeeDiscount
        fields = [
            'id', 'name', 'description', 'discount_type', 'discount_value',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class StudentFeeSerializer(serializers.ModelSerializer):
    """Serializer for student fees."""
    student_id = serializers.UUIDField(source='student.id', read_only=True)
    fee_structure_id = serializers.UUIDField(source='fee_structure.id', read_only=True)
    session_id = serializers.UUIDField(source='session.id', read_only=True)
    discount_id = serializers.UUIDField(source='discount.id', read_only=True, allow_null=True)
    balance_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = StudentFee
        fields = [
            'id', 'student_id', 'fee_structure_id', 'session_id', 'discount_id',
            'gross_amount', 'discount_amount', 'net_amount', 'paid_amount',
            'balance_amount', 'due_date', 'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'gross_amount', 'discount_amount', 'net_amount', 'created_at', 'updated_at']


class StudentFeeCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating student fees."""
    student_id = serializers.UUIDField(write_only=True)
    fee_structure_id = serializers.UUIDField(write_only=True)
    session_id = serializers.UUIDField(write_only=True)
    discount_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    
    class Meta:
        model = StudentFee
        fields = [
            'id', 'student_id', 'fee_structure_id', 'session_id', 'discount_id',
            'due_date'
        ]
        read_only_fields = ['id']
    
    def create(self, validated_data):
        student_id = validated_data.pop('student_id')
        fee_structure_id = validated_data.pop('fee_structure_id')
        session_id = validated_data.pop('session_id')
        discount_id = validated_data.pop('discount_id', None)
        
        validated_data['student'] = Student.objects.get(id=student_id)
        validated_data['fee_structure'] = FeeStructure.objects.get(id=fee_structure_id)
        validated_data['session'] = Session.objects.get(id=session_id)
        if discount_id:
            validated_data['discount'] = FeeDiscount.objects.get(id=discount_id)
        
        return super().create(validated_data)


class StudentFeeDetailSerializer(StudentFeeSerializer):
    """Detailed student fee serializer."""
    student = StudentSerializer(read_only=True)
    fee_structure = FeeStructureSerializer(read_only=True)
    session = SessionSerializer(read_only=True)
    discount = FeeDiscountSerializer(read_only=True)
    
    class Meta(StudentFeeSerializer.Meta):
        fields = StudentFeeSerializer.Meta.fields + ['student', 'fee_structure', 'session', 'discount']


class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for payments."""
    student_fee_id = serializers.UUIDField(source='student_fee.id', read_only=True)
    received_by_id = serializers.UUIDField(source='received_by.id', read_only=True, allow_null=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'student_fee_id', 'amount', 'payment_method',
            'transaction_id', 'reference_number', 'receipt_number',
            'payment_date', 'remarks', 'received_by_id',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'receipt_number', 'created_at', 'updated_at']


class PaymentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating payments."""
    student_fee_id = serializers.UUIDField(write_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'student_fee_id', 'amount', 'payment_method',
            'transaction_id', 'reference_number', 'payment_date', 'remarks'
        ]
        read_only_fields = ['id']
    
    def create(self, validated_data):
        student_fee_id = validated_data.pop('student_fee_id')
        validated_data['student_fee'] = StudentFee.objects.get(id=student_fee_id)
        
        # Set received_by to current user
        request = self.context.get('request')
        if request and request.user:
            validated_data['received_by'] = request.user
        
        return super().create(validated_data)


class PaymentDetailSerializer(PaymentSerializer):
    """Detailed payment serializer."""
    student_fee = StudentFeeSerializer(read_only=True)
    
    class Meta(PaymentSerializer.Meta):
        fields = PaymentSerializer.Meta.fields + ['student_fee']


class PaymentReminderSerializer(serializers.ModelSerializer):
    """Serializer for payment reminders."""
    student_fee_id = serializers.UUIDField(source='student_fee.id', read_only=True)
    
    class Meta:
        model = PaymentReminder
        fields = [
            'id', 'student_fee_id', 'reminder_date', 'message',
            'status', 'sent_at', 'created_at'
        ]
        read_only_fields = ['id', 'sent_at', 'created_at']


class PaymentReminderCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating payment reminders."""
    student_fee_id = serializers.UUIDField(write_only=True)
    
    class Meta:
        model = PaymentReminder
        fields = ['id', 'student_fee_id', 'reminder_date', 'message']
        read_only_fields = ['id']
    
    def create(self, validated_data):
        student_fee_id = validated_data.pop('student_fee_id')
        validated_data['student_fee'] = StudentFee.objects.get(id=student_fee_id)
        return super().create(validated_data)
