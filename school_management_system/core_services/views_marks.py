"""
ViewSets for dynamic marks distribution system.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models_marks import (
    AssessmentCategory,
    CoreSubjectMarksDistribution,
    CocurricularMarksDistribution,
    OptionalMarksDistribution
)
from .serializers_marks import (
    AssessmentCategorySerializer,
    CoreSubjectMarksDistributionSerializer,
    CocurricularMarksDistributionSerializer,
    OptionalMarksDistributionSerializer
)
from .permissions import IsAdminUser


class AssessmentCategoryViewSet(viewsets.ModelViewSet):
    """ViewSet for assessment categories."""
    queryset = AssessmentCategory.objects.all()
    serializer_class = AssessmentCategorySerializer
    permission_classes = [IsAdminUser]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['name', 'code']
    ordering_fields = ['display_order', 'name', 'created_at']
    ordering = ['display_order']
    
    def get_queryset(self):
        queryset = AssessmentCategory.objects.all()
        user = self.request.user
        
        if not user.is_authenticated:
            return queryset.none()
        
        if user.role == 'site_admin':
            school_id = self.request.query_params.get('school_id')
            if school_id:
                queryset = queryset.filter(school_id=school_id)
        elif user.school:
            queryset = queryset.filter(school=user.school)
        else:
            return queryset.none()
        
        return queryset
    
    @action(detail=False, methods=['post'], url_path='reorder')
    def reorder(self, request):
        """Reorder assessment categories."""
        category_ids = request.data.get('category_ids', [])
        
        if not category_ids:
            return Response(
                {'error': 'category_ids is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update display_order for each category
        for index, category_id in enumerate(category_ids):
            try:
                category = AssessmentCategory.objects.get(id=category_id)
                category.display_order = index
                category.save()
            except AssessmentCategory.DoesNotExist:
                pass
        
        return Response({'status': 'success', 'message': 'Categories reordered successfully'})


class CoreSubjectMarksDistributionViewSet(viewsets.ModelViewSet):
    """ViewSet for core subject marks distribution."""
    queryset = CoreSubjectMarksDistribution.objects.all()
    serializer_class = CoreSubjectMarksDistributionSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['class_ref']
    
    def get_queryset(self):
        queryset = CoreSubjectMarksDistribution.objects.select_related(
            'class_ref', 'assessment_category'
        )
        user = self.request.user
        
        if not user.is_authenticated:
            return queryset.none()
        
        if user.role == 'site_admin':
            school_id = self.request.query_params.get('school_id')
            if school_id:
                queryset = queryset.filter(class_ref__school_id=school_id)
        elif user.school:
            queryset = queryset.filter(class_ref__school=user.school)
        else:
            return queryset.none()
        
        class_id = self.request.query_params.get('class_id')
        if class_id:
            queryset = queryset.filter(class_ref_id=class_id)
        
        return queryset
    
    @action(detail=False, methods=['post'], url_path='bulk-update')
    def bulk_update(self, request):
        """
        Bulk update core marks distribution for a class.
        Expected payload: {
            class_id: string,
            distributions: [{assessment_category_id: string, full_marks: number}]
        }
        """
        class_id = request.data.get('class_id')
        distributions = request.data.get('distributions', [])
        
        if not class_id:
            return Response(
                {'error': 'class_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Delete existing distributions for this class
        CoreSubjectMarksDistribution.objects.filter(class_ref_id=class_id).delete()
        
        # Create new distributions
        created_distributions = []
        for dist in distributions:
            obj = CoreSubjectMarksDistribution.objects.create(
                class_ref_id=class_id,
                assessment_category_id=dist['assessment_category_id'],
                full_marks=dist['full_marks']
            )
            created_distributions.append(obj)
        
        serializer = self.get_serializer(created_distributions, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['post'], url_path='by-classes')
    def by_classes(self, request):
        """Get core marks distributions for multiple classes."""
        class_ids = request.data.get('class_ids', [])
        if not class_ids:
            return Response([])
        
        distributions = CoreSubjectMarksDistribution.objects.filter(
            class_ref_id__in=class_ids
        ).select_related('class_ref', 'assessment_category')
        
        return Response(CoreSubjectMarksDistributionSerializer(distributions, many=True).data)


class CocurricularMarksDistributionViewSet(viewsets.ModelViewSet):
    """ViewSet for cocurricular marks distribution."""
    queryset = CocurricularMarksDistribution.objects.all()
    serializer_class = CocurricularMarksDistributionSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['class_ref', 'cocurricular_subject']
    
    def get_queryset(self):
        queryset = CocurricularMarksDistribution.objects.select_related(
            'class_ref', 'cocurricular_subject', 'assessment_category'
        )
        user = self.request.user
        
        if not user.is_authenticated:
            return queryset.none()
        
        if user.role == 'site_admin':
            school_id = self.request.query_params.get('school_id')
            if school_id:
                queryset = queryset.filter(class_ref__school_id=school_id)
        elif user.school:
            queryset = queryset.filter(class_ref__school=user.school)
        else:
            return queryset.none()
        
        class_id = self.request.query_params.get('class_id')
        if class_id:
            queryset = queryset.filter(class_ref_id=class_id)
        
        return queryset
    
    @action(detail=False, methods=['post'], url_path='bulk-update')
    def bulk_update(self, request):
        """Bulk update cocurricular marks distribution for a class."""
        class_id = request.data.get('class_id')
        distributions = request.data.get('distributions', [])
        
        if not class_id:
            return Response(
                {'error': 'class_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Delete existing distributions for this class
        CocurricularMarksDistribution.objects.filter(class_ref_id=class_id).delete()
        
        # Create new distributions
        created_distributions = []
        for dist in distributions:
            obj = CocurricularMarksDistribution.objects.create(
                class_ref_id=class_id,
                cocurricular_subject_id=dist['cocurricular_subject_id'],
                assessment_category_id=dist['assessment_category_id'],
                full_marks=dist['full_marks']
            )
            created_distributions.append(obj)
        
        serializer = self.get_serializer(created_distributions, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class OptionalMarksDistributionViewSet(viewsets.ModelViewSet):
    """ViewSet for optional marks distribution."""
    queryset = OptionalMarksDistribution.objects.all()
    serializer_class = OptionalMarksDistributionSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['class_ref', 'optional_subject']
    
    def get_queryset(self):
        queryset = OptionalMarksDistribution.objects.select_related(
            'class_ref', 'optional_subject', 'assessment_category'
        )
        user = self.request.user
        
        if not user.is_authenticated:
            return queryset.none()
        
        if user.role == 'site_admin':
            school_id = self.request.query_params.get('school_id')
            if school_id:
                queryset = queryset.filter(class_ref__school_id=school_id)
        elif user.school:
            queryset = queryset.filter(class_ref__school=user.school)
        else:
            return queryset.none()
        
        class_id = self.request.query_params.get('class_id')
        if class_id:
            queryset = queryset.filter(class_ref_id=class_id)
        
        return queryset
    
    @action(detail=False, methods=['post'], url_path='bulk-update')
    def bulk_update(self, request):
        """Bulk update optional marks distribution for a class."""
        class_id = request.data.get('class_id')
        distributions = request.data.get('distributions', [])
        
        if not class_id:
            return Response(
                {'error': 'class_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Delete existing distributions for this class
        OptionalMarksDistribution.objects.filter(class_ref_id=class_id).delete()
        
        # Create new distributions
        created_distributions = []
        for dist in distributions:
            obj = OptionalMarksDistribution.objects.create(
                class_ref_id=class_id,
                optional_subject_id=dist['optional_subject_id'],
                assessment_category_id=dist['assessment_category_id'],
                full_marks=dist['full_marks']
            )
            created_distributions.append(obj)
        
        serializer = self.get_serializer(created_distributions, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
