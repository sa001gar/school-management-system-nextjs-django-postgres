"""
Serializers for Result Management API.
"""
from rest_framework import serializers
from django.db import transaction
from .models import StudentResult, StudentCocurricularResult, StudentOptionalResult
from core_services.serializers import (
    StudentSerializer, SubjectSerializer, SessionSerializer,
    CocurricularSubjectSerializer, OptionalSubjectSerializer
)
from core_services.models import Student, Subject, Session, CocurricularSubject, OptionalSubject


class StudentResultSerializer(serializers.ModelSerializer):
    """Serializer for student results."""
    student_id = serializers.UUIDField(source='student.id', read_only=True)
    subject_id = serializers.UUIDField(source='subject.id', read_only=True)
    session_id = serializers.UUIDField(source='session.id', read_only=True)
    
    class Meta:
        model = StudentResult
        fields = [
            'id', 'student_id', 'subject_id', 'session_id',
            'first_summative_full', 'first_summative_obtained',
            'first_formative_full', 'first_formative_obtained',
            'second_summative_full', 'second_summative_obtained',
            'second_formative_full', 'second_formative_obtained',
            'third_summative_full', 'third_summative_obtained',
            'third_formative_full', 'third_formative_obtained',
            'total_marks', 'grade', 'conduct', 'attendance_days',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'total_marks', 'grade', 'created_at', 'updated_at']


class StudentResultCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating student results."""
    student_id = serializers.UUIDField(write_only=True)
    subject_id = serializers.UUIDField(write_only=True)
    session_id = serializers.UUIDField(write_only=True)
    
    class Meta:
        model = StudentResult
        fields = [
            'id', 'student_id', 'subject_id', 'session_id',
            'first_summative_full', 'first_summative_obtained',
            'first_formative_full', 'first_formative_obtained',
            'second_summative_full', 'second_summative_obtained',
            'second_formative_full', 'second_formative_obtained',
            'third_summative_full', 'third_summative_obtained',
            'third_formative_full', 'third_formative_obtained',
            'conduct', 'attendance_days'
        ]
        read_only_fields = ['id']
    
    def create(self, validated_data):
        student_id = validated_data.pop('student_id')
        subject_id = validated_data.pop('subject_id')
        session_id = validated_data.pop('session_id')
        
        validated_data['student'] = Student.objects.get(id=student_id)
        validated_data['subject'] = Subject.objects.get(id=subject_id)
        validated_data['session'] = Session.objects.get(id=session_id)
        
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        # Remove the IDs if present (shouldn't change on update)
        validated_data.pop('student_id', None)
        validated_data.pop('subject_id', None)
        validated_data.pop('session_id', None)
        return super().update(instance, validated_data)


class StudentResultDetailSerializer(StudentResultSerializer):
    """Detailed result serializer with related objects."""
    student = StudentSerializer(read_only=True)
    subject = SubjectSerializer(read_only=True)
    session = SessionSerializer(read_only=True)
    
    class Meta(StudentResultSerializer.Meta):
        fields = StudentResultSerializer.Meta.fields + ['student', 'subject', 'session']


class StudentResultUpsertSerializer(serializers.Serializer):
    """Serializer for upserting student results (create or update)."""
    student_id = serializers.UUIDField()
    subject_id = serializers.UUIDField()
    session_id = serializers.UUIDField()
    first_summative_full = serializers.IntegerField(default=40)
    first_summative_obtained = serializers.IntegerField(default=0)
    first_formative_full = serializers.IntegerField(default=10)
    first_formative_obtained = serializers.IntegerField(default=0)
    second_summative_full = serializers.IntegerField(default=40)
    second_summative_obtained = serializers.IntegerField(default=0)
    second_formative_full = serializers.IntegerField(default=10)
    second_formative_obtained = serializers.IntegerField(default=0)
    third_summative_full = serializers.IntegerField(default=40)
    third_summative_obtained = serializers.IntegerField(default=0)
    third_formative_full = serializers.IntegerField(default=10)
    third_formative_obtained = serializers.IntegerField(default=0)
    conduct = serializers.CharField(default='Good', max_length=50)
    attendance_days = serializers.IntegerField(default=0)
    
    def create(self, validated_data):
        student = Student.objects.get(id=validated_data.pop('student_id'))
        subject = Subject.objects.get(id=validated_data.pop('subject_id'))
        session = Session.objects.get(id=validated_data.pop('session_id'))
        
        result, created = StudentResult.objects.update_or_create(
            student=student,
            subject=subject,
            session=session,
            defaults=validated_data
        )
        return result


class BulkStudentResultUpsertSerializer(serializers.Serializer):
    """Serializer for bulk upserting student results."""
    results = StudentResultUpsertSerializer(many=True)
    
    @transaction.atomic
    def create(self, validated_data):
        results_data = validated_data.get('results', [])
        if not results_data:
            return []
        
        # Collect all unique IDs to prefetch
        student_ids = set()
        subject_ids = set()
        session_ids = set()
        
        for result_data in results_data:
            student_ids.add(result_data['student_id'])
            subject_ids.add(result_data['subject_id'])
            session_ids.add(result_data['session_id'])
        
        # Prefetch all related objects in bulk
        students_map = {s.id: s for s in Student.objects.filter(id__in=student_ids)}
        subjects_map = {s.id: s for s in Subject.objects.filter(id__in=subject_ids)}
        sessions_map = {s.id: s for s in Session.objects.filter(id__in=session_ids)}
        
        upserted_results = []
        
        for result_data in results_data:
            student = students_map.get(result_data.pop('student_id'))
            subject = subjects_map.get(result_data.pop('subject_id'))
            session = sessions_map.get(result_data.pop('session_id'))
            
            if not all([student, subject, session]):
                continue
            
            result, created = StudentResult.objects.update_or_create(
                student=student,
                subject=subject,
                session=session,
                defaults=result_data
            )
            upserted_results.append(result)
        
        return upserted_results


class StudentCocurricularResultSerializer(serializers.ModelSerializer):
    """Serializer for student co-curricular results."""
    student_id = serializers.UUIDField(source='student.id', read_only=True)
    cocurricular_subject_id = serializers.UUIDField(source='cocurricular_subject.id', read_only=True)
    session_id = serializers.UUIDField(source='session.id', read_only=True)
    total_marks = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = StudentCocurricularResult
        fields = [
            'id', 'student_id', 'cocurricular_subject_id', 'session_id',
            'first_term_marks', 'second_term_marks', 'final_term_marks',
            'full_marks', 'total_marks',
            'first_term_grade', 'second_term_grade', 'final_term_grade', 'overall_grade',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class StudentCocurricularResultCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating co-curricular results."""
    student_id = serializers.UUIDField(write_only=True)
    cocurricular_subject_id = serializers.UUIDField(write_only=True)
    session_id = serializers.UUIDField(write_only=True)
    
    class Meta:
        model = StudentCocurricularResult
        fields = [
            'id', 'student_id', 'cocurricular_subject_id', 'session_id',
            'first_term_marks', 'second_term_marks', 'final_term_marks',
            'full_marks',
            'first_term_grade', 'second_term_grade', 'final_term_grade', 'overall_grade'
        ]
        read_only_fields = ['id']
    
    def create(self, validated_data):
        student_id = validated_data.pop('student_id')
        cocurricular_subject_id = validated_data.pop('cocurricular_subject_id')
        session_id = validated_data.pop('session_id')
        
        validated_data['student'] = Student.objects.get(id=student_id)
        validated_data['cocurricular_subject'] = CocurricularSubject.objects.get(id=cocurricular_subject_id)
        validated_data['session'] = Session.objects.get(id=session_id)
        
        return super().create(validated_data)


class StudentCocurricularResultDetailSerializer(StudentCocurricularResultSerializer):
    """Detailed co-curricular result serializer."""
    student = StudentSerializer(read_only=True)
    cocurricular_subject = CocurricularSubjectSerializer(read_only=True)
    session = SessionSerializer(read_only=True)
    
    class Meta(StudentCocurricularResultSerializer.Meta):
        fields = StudentCocurricularResultSerializer.Meta.fields + ['student', 'cocurricular_subject', 'session']


class StudentOptionalResultSerializer(serializers.ModelSerializer):
    """Serializer for student optional results."""
    student_id = serializers.UUIDField(source='student.id', read_only=True)
    optional_subject_id = serializers.UUIDField(source='optional_subject.id', read_only=True)
    session_id = serializers.UUIDField(source='session.id', read_only=True)
    
    class Meta:
        model = StudentOptionalResult
        fields = [
            'id', 'student_id', 'optional_subject_id', 'session_id',
            'obtained_marks', 'full_marks', 'grade',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'grade', 'created_at', 'updated_at']


class StudentOptionalResultCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating optional results."""
    student_id = serializers.UUIDField(write_only=True)
    optional_subject_id = serializers.UUIDField(write_only=True)
    session_id = serializers.UUIDField(write_only=True)
    
    class Meta:
        model = StudentOptionalResult
        fields = [
            'id', 'student_id', 'optional_subject_id', 'session_id',
            'obtained_marks', 'full_marks'
        ]
        read_only_fields = ['id']
    
    def create(self, validated_data):
        student_id = validated_data.pop('student_id')
        optional_subject_id = validated_data.pop('optional_subject_id')
        session_id = validated_data.pop('session_id')
        
        validated_data['student'] = Student.objects.get(id=student_id)
        validated_data['optional_subject'] = OptionalSubject.objects.get(id=optional_subject_id)
        validated_data['session'] = Session.objects.get(id=session_id)
        
        return super().create(validated_data)


class StudentOptionalResultDetailSerializer(StudentOptionalResultSerializer):
    """Detailed optional result serializer."""
    student = StudentSerializer(read_only=True)
    optional_subject = OptionalSubjectSerializer(read_only=True)
    session = SessionSerializer(read_only=True)
    
    class Meta(StudentOptionalResultSerializer.Meta):
        fields = StudentOptionalResultSerializer.Meta.fields + ['student', 'optional_subject', 'session']


class StudentCocurricularResultUpsertSerializer(serializers.Serializer):
    """Serializer for upserting co-curricular results."""
    student_id = serializers.UUIDField()
    cocurricular_subject_id = serializers.UUIDField()
    session_id = serializers.UUIDField()
    first_term_marks = serializers.IntegerField(default=0)
    second_term_marks = serializers.IntegerField(default=0)
    final_term_marks = serializers.IntegerField(default=0)
    full_marks = serializers.IntegerField(default=100)
    first_term_grade = serializers.CharField(max_length=10, default='', allow_blank=True)
    second_term_grade = serializers.CharField(max_length=10, default='', allow_blank=True)
    final_term_grade = serializers.CharField(max_length=10, default='', allow_blank=True)
    overall_grade = serializers.CharField(max_length=10, default='', allow_blank=True)


class BulkStudentCocurricularResultUpsertSerializer(serializers.Serializer):
    """Serializer for bulk upserting co-curricular results."""
    results = StudentCocurricularResultUpsertSerializer(many=True)
    
    @transaction.atomic
    def create(self, validated_data):
        results_data = validated_data.get('results', [])
        if not results_data:
            return []
        
        # Collect all unique IDs to prefetch
        student_ids = set()
        subject_ids = set()
        session_ids = set()
        
        for result_data in results_data:
            student_ids.add(result_data['student_id'])
            subject_ids.add(result_data['cocurricular_subject_id'])
            session_ids.add(result_data['session_id'])
        
        # Prefetch all related objects in bulk
        students_map = {s.id: s for s in Student.objects.filter(id__in=student_ids)}
        subjects_map = {s.id: s for s in CocurricularSubject.objects.filter(id__in=subject_ids)}
        sessions_map = {s.id: s for s in Session.objects.filter(id__in=session_ids)}
        
        upserted_results = []
        
        for result_data in results_data:
            student = students_map.get(result_data.pop('student_id'))
            subject = subjects_map.get(result_data.pop('cocurricular_subject_id'))
            session = sessions_map.get(result_data.pop('session_id'))
            
            if not all([student, subject, session]):
                continue
            
            result, created = StudentCocurricularResult.objects.update_or_create(
                student=student,
                cocurricular_subject=subject,
                session=session,
                defaults=result_data
            )
            upserted_results.append(result)
        
        return upserted_results


class StudentOptionalResultUpsertSerializer(serializers.Serializer):
    """Serializer for upserting optional results."""
    student_id = serializers.UUIDField()
    optional_subject_id = serializers.UUIDField()
    session_id = serializers.UUIDField()
    obtained_marks = serializers.IntegerField(default=0)
    full_marks = serializers.IntegerField(default=50)
    grade = serializers.CharField(max_length=10, default='', allow_blank=True)


class BulkStudentOptionalResultUpsertSerializer(serializers.Serializer):
    """Serializer for bulk upserting optional results."""
    results = StudentOptionalResultUpsertSerializer(many=True)
    
    @transaction.atomic
    def create(self, validated_data):
        results_data = validated_data.get('results', [])
        if not results_data:
            return []
        
        # Collect all unique IDs to prefetch
        student_ids = set()
        subject_ids = set()
        session_ids = set()
        
        for result_data in results_data:
            student_ids.add(result_data['student_id'])
            subject_ids.add(result_data['optional_subject_id'])
            session_ids.add(result_data['session_id'])
        
        # Prefetch all related objects in bulk
        students_map = {s.id: s for s in Student.objects.filter(id__in=student_ids)}
        subjects_map = {s.id: s for s in OptionalSubject.objects.filter(id__in=subject_ids)}
        sessions_map = {s.id: s for s in Session.objects.filter(id__in=session_ids)}
        
        upserted_results = []
        
        for result_data in results_data:
            student = students_map.get(result_data.pop('student_id'))
            subject = subjects_map.get(result_data.pop('optional_subject_id'))
            session = sessions_map.get(result_data.pop('session_id'))
            
            if not all([student, subject, session]):
                continue
            
            result, created = StudentOptionalResult.objects.update_or_create(
                student=student,
                optional_subject=subject,
                session=session,
                defaults=result_data
            )
            upserted_results.append(result)
        
        return upserted_results
