"""
Serializers for Core Services API.
"""
from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from .models import (
    CustomUser, Admin, Teacher, Session, Class, Section,
    Subject, CocurricularSubject, OptionalSubject, ClassSubjectAssignment,
    ClassOptionalConfig, ClassOptionalAssignment, ClassCocurricularConfig,
    ClassMarksDistribution, SchoolConfig, Student
)


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user basic information."""
    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'username', 'role', 'is_active']
        read_only_fields = ['id', 'is_active']


class AdminSerializer(serializers.ModelSerializer):
    """Serializer for admin profiles."""
    email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = Admin
        fields = ['id', 'email', 'name', 'created_at']
        read_only_fields = ['id', 'created_at']


class TeacherSerializer(serializers.ModelSerializer):
    """Serializer for teacher profiles."""
    email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = Teacher
        fields = ['id', 'email', 'name', 'created_at']
        read_only_fields = ['id', 'created_at']


class TeacherCreateSerializer(serializers.Serializer):
    """Serializer for creating a new teacher with user account."""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, validators=[validate_password])
    name = serializers.CharField(max_length=255)
    
    def validate_email(self, value):
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value
    
    def create(self, validated_data):
        user = CustomUser.objects.create_user(
            email=validated_data['email'],
            username=validated_data['email'],
            password=validated_data['password'],
            role='teacher'
        )
        teacher = Teacher.objects.create(
            user=user,
            name=validated_data['name']
        )
        return teacher


class LoginSerializer(serializers.Serializer):
    """Serializer for user login."""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, data):
        email = data.get('email')
        password = data.get('password')
        
        if email and password:
            user = authenticate(username=email, password=password)
            if not user:
                raise serializers.ValidationError("Invalid login credentials.")
            if not user.is_active:
                raise serializers.ValidationError("User account is disabled.")
            data['user'] = user
        else:
            raise serializers.ValidationError("Must include 'email' and 'password'.")
        
        return data


class SessionSerializer(serializers.ModelSerializer):
    """Serializer for academic sessions."""
    class Meta:
        model = Session
        fields = ['id', 'name', 'start_date', 'end_date', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']


class ClassSerializer(serializers.ModelSerializer):
    """Serializer for classes."""
    class Meta:
        model = Class
        fields = ['id', 'name', 'level', 'created_at']
        read_only_fields = ['id', 'created_at']


class SectionSerializer(serializers.ModelSerializer):
    """Serializer for sections."""
    class_id = serializers.UUIDField(source='class_ref.id', read_only=True)
    class_name = serializers.CharField(source='class_ref.name', read_only=True)
    
    class Meta:
        model = Section
        fields = ['id', 'name', 'class_id', 'class_name', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def create(self, validated_data):
        class_id = self.context.get('class_id') or self.initial_data.get('class_id')
        if class_id:
            validated_data['class_ref'] = Class.objects.get(id=class_id)
        return super().create(validated_data)


class SectionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating sections with class_id."""
    class_id = serializers.UUIDField(write_only=True)
    
    class Meta:
        model = Section
        fields = ['id', 'name', 'class_id', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def create(self, validated_data):
        class_id = validated_data.pop('class_id')
        validated_data['class_ref'] = Class.objects.get(id=class_id)
        return super().create(validated_data)


class SubjectSerializer(serializers.ModelSerializer):
    """Serializer for subjects."""
    class Meta:
        model = Subject
        fields = ['id', 'name', 'code', 'full_marks', 'created_at']
        read_only_fields = ['id', 'created_at']


class CocurricularSubjectSerializer(serializers.ModelSerializer):
    """Serializer for co-curricular subjects."""
    class Meta:
        model = CocurricularSubject
        fields = ['id', 'name', 'code', 'created_at']
        read_only_fields = ['id', 'created_at']


class OptionalSubjectSerializer(serializers.ModelSerializer):
    """Serializer for optional subjects."""
    class Meta:
        model = OptionalSubject
        fields = ['id', 'name', 'code', 'default_full_marks', 'created_at']
        read_only_fields = ['id', 'created_at']


class ClassSubjectAssignmentSerializer(serializers.ModelSerializer):
    """Serializer for class-subject assignments."""
    class_id = serializers.UUIDField(source='class_ref.id', read_only=True)
    subject = SubjectSerializer(read_only=True)
    subject_id = serializers.UUIDField(write_only=True)
    
    class Meta:
        model = ClassSubjectAssignment
        fields = ['id', 'class_id', 'subject', 'subject_id', 'is_required', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def create(self, validated_data):
        subject_id = validated_data.pop('subject_id')
        class_id = self.context.get('class_id') or self.initial_data.get('class_id')
        subject = Subject.objects.get(id=subject_id)
        class_ref = Class.objects.get(id=class_id) if class_id else None
        
        # Use get_or_create to handle duplicates gracefully
        instance, created = ClassSubjectAssignment.objects.get_or_create(
            class_ref=class_ref,
            subject=subject,
            defaults={'is_required': validated_data.get('is_required', True)}
        )
        
        # If it already exists, update is_required if provided
        if not created and 'is_required' in validated_data:
            instance.is_required = validated_data['is_required']
            instance.save()
        
        return instance


class ClassOptionalConfigSerializer(serializers.ModelSerializer):
    """Serializer for class optional configuration."""
    class_id = serializers.UUIDField(source='class_ref.id', read_only=True)
    
    class Meta:
        model = ClassOptionalConfig
        fields = ['id', 'class_id', 'has_optional', 'created_at']
        read_only_fields = ['id', 'created_at']


class ClassOptionalAssignmentSerializer(serializers.ModelSerializer):
    """Serializer for class optional subject assignments."""
    class_id = serializers.UUIDField(source='class_ref.id', read_only=True)
    optional_subject = OptionalSubjectSerializer(read_only=True)
    optional_subject_id = serializers.UUIDField(write_only=True)
    
    class Meta:
        model = ClassOptionalAssignment
        fields = ['id', 'class_id', 'optional_subject', 'optional_subject_id', 'full_marks', 'is_required', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def create(self, validated_data):
        optional_subject_id = validated_data.pop('optional_subject_id')
        class_id = self.context.get('class_id') or self.initial_data.get('class_id')
        optional_subject = OptionalSubject.objects.get(id=optional_subject_id)
        class_ref = Class.objects.get(id=class_id) if class_id else None
        
        # Use get_or_create to handle duplicates gracefully
        instance, created = ClassOptionalAssignment.objects.get_or_create(
            class_ref=class_ref,
            optional_subject=optional_subject,
            defaults={
                'full_marks': validated_data.get('full_marks', 100),
                'is_required': validated_data.get('is_required', True)
            }
        )
        
        # If it already exists, update fields if provided
        if not created:
            if 'full_marks' in validated_data:
                instance.full_marks = validated_data['full_marks']
            if 'is_required' in validated_data:
                instance.is_required = validated_data['is_required']
            instance.save()
        
        return instance


class ClassCocurricularConfigSerializer(serializers.ModelSerializer):
    """Serializer for class co-curricular configuration."""
    class_id = serializers.PrimaryKeyRelatedField(
        queryset=Class.objects.all(),
        source='class_ref'
    )
    
    class Meta:
        model = ClassCocurricularConfig
        fields = ['id', 'class_id', 'has_cocurricular', 'created_at']
        read_only_fields = ['id', 'created_at']


class ClassMarksDistributionSerializer(serializers.ModelSerializer):
    """Serializer for class marks distribution."""
    class_id = serializers.UUIDField(source='class_ref.id', read_only=True)
    total_marks = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = ClassMarksDistribution
        fields = [
            'id', 'class_id',
            'first_summative_marks', 'first_formative_marks',
            'second_summative_marks', 'second_formative_marks',
            'third_summative_marks', 'third_formative_marks',
            'number_of_unit_tests', 'has_final_term',
            'unit_test_marks', 'formative_marks', 'final_term_marks',
            'total_marks', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class SchoolConfigSerializer(serializers.ModelSerializer):
    """Serializer for school configuration."""
    class_id = serializers.UUIDField(source='class_ref.id', read_only=True, allow_null=True)
    session_id = serializers.UUIDField(source='session.id', read_only=True, allow_null=True)
    
    class Meta:
        model = SchoolConfig
        fields = ['id', 'class_id', 'session_id', 'total_school_days', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class StudentSerializer(serializers.ModelSerializer):
    """Serializer for students."""
    class_id = serializers.UUIDField(source='class_ref.id', read_only=True, allow_null=True)
    section_id = serializers.UUIDField(source='section.id', read_only=True, allow_null=True)
    session_id = serializers.UUIDField(source='session.id', read_only=True, allow_null=True)
    
    class Meta:
        model = Student
        fields = ['id', 'roll_no', 'name', 'class_id', 'section_id', 'session_id', 'created_at']
        read_only_fields = ['id', 'created_at']


class StudentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating students."""
    class_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    section_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    session_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    
    class Meta:
        model = Student
        fields = ['id', 'roll_no', 'name', 'class_id', 'section_id', 'session_id', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def create(self, validated_data):
        class_id = validated_data.pop('class_id', None)
        section_id = validated_data.pop('section_id', None)
        session_id = validated_data.pop('session_id', None)
        
        if class_id:
            validated_data['class_ref'] = Class.objects.get(id=class_id)
        if section_id:
            validated_data['section'] = Section.objects.get(id=section_id)
        if session_id:
            validated_data['session'] = Session.objects.get(id=session_id)
        
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        class_id = validated_data.pop('class_id', None)
        section_id = validated_data.pop('section_id', None)
        session_id = validated_data.pop('session_id', None)
        
        if class_id:
            instance.class_ref = Class.objects.get(id=class_id)
        if section_id:
            instance.section = Section.objects.get(id=section_id)
        if session_id:
            instance.session = Session.objects.get(id=session_id)
        
        return super().update(instance, validated_data)


class StudentDetailSerializer(StudentSerializer):
    """Detailed student serializer with related objects."""
    class_info = ClassSerializer(source='class_ref', read_only=True)
    section_info = SectionSerializer(source='section', read_only=True)
    session_info = SessionSerializer(source='session', read_only=True)
    
    class Meta(StudentSerializer.Meta):
        fields = StudentSerializer.Meta.fields + ['class_info', 'section_info', 'session_info']


class BulkStudentCreateSerializer(serializers.Serializer):
    """Serializer for bulk student creation."""
    students = StudentCreateSerializer(many=True)
    
    @transaction.atomic
    def create(self, validated_data):
        students_data = validated_data.get('students', [])
        if not students_data:
            return []
        
        # Collect all unique IDs to prefetch
        class_ids = set()
        section_ids = set()
        session_ids = set()
        
        for student_data in students_data:
            if 'class_id' in student_data and student_data['class_id']:
                class_ids.add(student_data['class_id'])
            if 'section_id' in student_data and student_data['section_id']:
                section_ids.add(student_data['section_id'])
            if 'session_id' in student_data and student_data['session_id']:
                session_ids.add(student_data['session_id'])
        
        # Prefetch all related objects in bulk
        classes_map = {c.id: c for c in Class.objects.filter(id__in=class_ids)} if class_ids else {}
        sections_map = {s.id: s for s in Section.objects.filter(id__in=section_ids)} if section_ids else {}
        sessions_map = {s.id: s for s in Session.objects.filter(id__in=session_ids)} if session_ids else {}
        
        # Prepare student objects for bulk creation
        student_objects = []
        
        for student_data in students_data:
            class_id = student_data.pop('class_id', None)
            section_id = student_data.pop('section_id', None)
            session_id = student_data.pop('session_id', None)
            
            student = Student(
                roll_no=student_data.get('roll_no'),
                name=student_data.get('name'),
                class_ref=classes_map.get(class_id) if class_id else None,
                section=sections_map.get(section_id) if section_id else None,
                session=sessions_map.get(session_id) if session_id else None
            )
            student_objects.append(student)
        
        # Bulk create all students in a single query
        created_students = Student.objects.bulk_create(student_objects)
        
        return created_students
