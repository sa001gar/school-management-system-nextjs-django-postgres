"""
Serializers for dynamic marks distribution system.
"""
from rest_framework import serializers
from .models_marks import (
    AssessmentCategory,
    CoreSubjectMarksDistribution,
    CocurricularMarksDistribution,
    OptionalMarksDistribution
)
from .models import Class, CocurricularSubject, OptionalSubject


class AssessmentCategorySerializer(serializers.ModelSerializer):
    """Serializer for assessment categories."""
    school_id = serializers.UUIDField(source='school.id', read_only=True)
    
    class Meta:
        model = AssessmentCategory
        fields = [
            'id', 'school_id', 'name', 'code', 'category_type',
            'display_order', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        request = self.context.get('request')
        school = request.user.school if request and hasattr(request.user, 'school') else None
        validated_data['school'] = school
        return super().create(validated_data)


class CoreSubjectMarksDistributionSerializer(serializers.ModelSerializer):
    """Serializer for core subject marks distribution."""
    class_id = serializers.UUIDField(source='class_ref.id', read_only=True)
    class_name = serializers.CharField(source='class_ref.name', read_only=True)
    assessment_category = AssessmentCategorySerializer(read_only=True)
    assessment_category_id = serializers.UUIDField(write_only=True)
    
    class Meta:
        model = CoreSubjectMarksDistribution
        fields = [
            'id', 'class_id', 'class_name', 'assessment_category',
            'assessment_category_id', 'full_marks', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        category_id = validated_data.pop('assessment_category_id')
        class_id = self.initial_data.get('class_id')
        
        validated_data['assessment_category'] = AssessmentCategory.objects.get(id=category_id)
        if class_id:
            validated_data['class_ref'] = Class.objects.get(id=class_id)
        
        return super().create(validated_data)


class CocurricularMarksDistributionSerializer(serializers.ModelSerializer):
    """Serializer for cocurricular marks distribution."""
    class_id = serializers.UUIDField(source='class_ref.id', read_only=True)
    class_name = serializers.CharField(source='class_ref.name', read_only=True)
    cocurricular_subject_name = serializers.CharField(source='cocurricular_subject.name', read_only=True)
    assessment_category = AssessmentCategorySerializer(read_only=True)
    assessment_category_id = serializers.UUIDField(write_only=True)
    cocurricular_subject_id = serializers.UUIDField(write_only=True)
    
    class Meta:
        model = CocurricularMarksDistribution
        fields = [
            'id', 'class_id', 'class_name', 'cocurricular_subject_id',
            'cocurricular_subject_name', 'assessment_category',
            'assessment_category_id', 'full_marks', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        category_id = validated_data.pop('assessment_category_id')
        subject_id = validated_data.pop('cocurricular_subject_id')
        class_id = self.initial_data.get('class_id')
        
        validated_data['assessment_category'] = AssessmentCategory.objects.get(id=category_id)
        validated_data['cocurricular_subject'] = CocurricularSubject.objects.get(id=subject_id)
        if class_id:
            validated_data['class_ref'] = Class.objects.get(id=class_id)
        
        return super().create(validated_data)


class OptionalMarksDistributionSerializer(serializers.ModelSerializer):
    """Serializer for optional marks distribution."""
    class_id = serializers.UUIDField(source='class_ref.id', read_only=True)
    class_name = serializers.CharField(source='class_ref.name', read_only=True)
    optional_subject_name = serializers.CharField(source='optional_subject.name', read_only=True)
    assessment_category = AssessmentCategorySerializer(read_only=True)
    assessment_category_id = serializers.UUIDField(write_only=True)
    optional_subject_id = serializers.UUIDField(write_only=True)
    
    class Meta:
        model = OptionalMarksDistribution
        fields = [
            'id', 'class_id', 'class_name', 'optional_subject_id',
            'optional_subject_name', 'assessment_category',
            'assessment_category_id', 'full_marks', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        category_id = validated_data.pop('assessment_category_id')
        subject_id = validated_data.pop('optional_subject_id')
        class_id = self.initial_data.get('class_id')
        
        validated_data['assessment_category'] = AssessmentCategory.objects.get(id=category_id)
        validated_data['optional_subject'] = OptionalSubject.objects.get(id=subject_id)
        if class_id:
            validated_data['class_ref'] = Class.objects.get(id=class_id)
        
        return super().create(validated_data)
