"""
Views for Core Services API.
"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import (
    CustomUser, Admin, Teacher, Session, Class, Section,
    Subject, CocurricularSubject, OptionalSubject, ClassSubjectAssignment,
    ClassOptionalConfig, ClassOptionalAssignment, ClassCocurricularConfig,
    ClassMarksDistribution, SchoolConfig, Student
)
from .serializers import (
    UserSerializer, AdminSerializer, TeacherSerializer, TeacherCreateSerializer,
    LoginSerializer, SessionSerializer, ClassSerializer, SectionSerializer,
    SectionCreateSerializer, SubjectSerializer, CocurricularSubjectSerializer,
    OptionalSubjectSerializer, ClassSubjectAssignmentSerializer,
    ClassOptionalConfigSerializer, ClassOptionalAssignmentSerializer,
    ClassCocurricularConfigSerializer, ClassMarksDistributionSerializer,
    SchoolConfigSerializer, StudentSerializer, StudentCreateSerializer,
    StudentDetailSerializer, BulkStudentCreateSerializer
)


class IsAdminUser(permissions.BasePermission):
    """Permission class to check if user is admin."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'admin'


class LoginView(APIView):
    """View for user login."""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        
        # Get user profile
        teacher = None
        admin = None
        
        if hasattr(user, 'teacher_profile'):
            teacher = TeacherSerializer(user.teacher_profile).data
        if hasattr(user, 'admin_profile'):
            admin = AdminSerializer(user.admin_profile).data
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
            'teacher': teacher,
            'admin': admin
        })


class LogoutView(APIView):
    """View for user logout."""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({'message': 'Successfully logged out.'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class CurrentUserView(APIView):
    """View to get current user profile."""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        teacher = None
        admin = None
        
        if hasattr(user, 'teacher_profile'):
            teacher = TeacherSerializer(user.teacher_profile).data
        if hasattr(user, 'admin_profile'):
            admin = AdminSerializer(user.admin_profile).data
        
        return Response({
            'user': UserSerializer(user).data,
            'teacher': teacher,
            'admin': admin
        })


class SessionViewSet(viewsets.ModelViewSet):
    """ViewSet for sessions."""
    queryset = Session.objects.all()
    serializer_class = SessionSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['name']
    ordering_fields = ['created_at', 'start_date', 'end_date']
    ordering = ['-created_at']
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [permissions.IsAuthenticated()]


class ClassViewSet(viewsets.ModelViewSet):
    """ViewSet for classes."""
    queryset = Class.objects.all()
    serializer_class = ClassSerializer
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['level', 'name']
    ordering = ['level']
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [permissions.IsAuthenticated()]


class SectionViewSet(viewsets.ModelViewSet):
    """ViewSet for sections."""
    queryset = Section.objects.all()
    serializer_class = SectionSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['class_ref']
    search_fields = ['name']
    ordering_fields = ['name']
    ordering = ['name']
    
    def get_serializer_class(self):
        if self.action in ['create']:
            return SectionCreateSerializer
        return SectionSerializer
    
    def get_queryset(self):
        queryset = Section.objects.all()
        class_id = self.request.query_params.get('class_id')
        if class_id:
            queryset = queryset.filter(class_ref_id=class_id)
        return queryset
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [permissions.IsAuthenticated()]


class SubjectViewSet(viewsets.ModelViewSet):
    """ViewSet for subjects."""
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'code']
    ordering = ['name']
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [permissions.IsAuthenticated()]


class CocurricularSubjectViewSet(viewsets.ModelViewSet):
    """ViewSet for co-curricular subjects."""
    queryset = CocurricularSubject.objects.all()
    serializer_class = CocurricularSubjectSerializer
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['name', 'code']
    ordering_fields = ['name']
    ordering = ['name']
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [permissions.IsAuthenticated()]


class OptionalSubjectViewSet(viewsets.ModelViewSet):
    """ViewSet for optional subjects."""
    queryset = OptionalSubject.objects.all()
    serializer_class = OptionalSubjectSerializer
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['name', 'code']
    ordering_fields = ['name']
    ordering = ['name']
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [permissions.IsAuthenticated()]


class ClassSubjectAssignmentViewSet(viewsets.ModelViewSet):
    """ViewSet for class-subject assignments."""
    queryset = ClassSubjectAssignment.objects.all()
    serializer_class = ClassSubjectAssignmentSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['class_ref', 'subject', 'is_required']
    
    def get_queryset(self):
        queryset = ClassSubjectAssignment.objects.select_related('subject', 'class_ref')
        class_id = self.request.query_params.get('class_id')
        if class_id:
            queryset = queryset.filter(class_ref_id=class_id)
        return queryset
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [permissions.IsAuthenticated()]
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['class_id'] = self.request.data.get('class_id')
        return context


class ClassOptionalConfigViewSet(viewsets.ModelViewSet):
    """ViewSet for class optional configuration."""
    queryset = ClassOptionalConfig.objects.all()
    serializer_class = ClassOptionalConfigSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['class_ref', 'has_optional']
    
    def get_queryset(self):
        queryset = ClassOptionalConfig.objects.select_related('class_ref')
        class_id = self.request.query_params.get('class_id')
        if class_id:
            queryset = queryset.filter(class_ref_id=class_id)
        return queryset
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [permissions.IsAuthenticated()]


class ClassOptionalAssignmentViewSet(viewsets.ModelViewSet):
    """ViewSet for class optional subject assignments."""
    queryset = ClassOptionalAssignment.objects.all()
    serializer_class = ClassOptionalAssignmentSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['class_ref', 'optional_subject']
    
    def get_queryset(self):
        queryset = ClassOptionalAssignment.objects.select_related('class_ref', 'optional_subject')
        class_id = self.request.query_params.get('class_id')
        if class_id:
            queryset = queryset.filter(class_ref_id=class_id)
        return queryset
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [permissions.IsAuthenticated()]


class ClassCocurricularConfigViewSet(viewsets.ModelViewSet):
    """ViewSet for class co-curricular configuration."""
    queryset = ClassCocurricularConfig.objects.all()
    serializer_class = ClassCocurricularConfigSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['class_ref', 'has_cocurricular']
    
    def get_queryset(self):
        queryset = ClassCocurricularConfig.objects.select_related('class_ref')
        class_id = self.request.query_params.get('class_id')
        if class_id:
            queryset = queryset.filter(class_ref_id=class_id)
        return queryset
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [permissions.IsAuthenticated()]


class ClassMarksDistributionViewSet(viewsets.ModelViewSet):
    """ViewSet for class marks distribution."""
    queryset = ClassMarksDistribution.objects.all()
    serializer_class = ClassMarksDistributionSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['class_ref']
    
    def get_queryset(self):
        queryset = ClassMarksDistribution.objects.select_related('class_ref')
        class_id = self.request.query_params.get('class_id')
        if class_id:
            queryset = queryset.filter(class_ref_id=class_id)
        return queryset
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [permissions.IsAuthenticated()]


class SchoolConfigViewSet(viewsets.ModelViewSet):
    """ViewSet for school configuration."""
    queryset = SchoolConfig.objects.all()
    serializer_class = SchoolConfigSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['class_ref', 'session']
    
    def get_queryset(self):
        queryset = SchoolConfig.objects.select_related('class_ref', 'session')
        class_id = self.request.query_params.get('class_id')
        session_id = self.request.query_params.get('session_id')
        if class_id:
            queryset = queryset.filter(class_ref_id=class_id)
        if session_id:
            queryset = queryset.filter(session_id=session_id)
        return queryset
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [permissions.IsAuthenticated()]


class StudentViewSet(viewsets.ModelViewSet):
    """ViewSet for students."""
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['class_ref', 'section', 'session']
    search_fields = ['name', 'roll_no']
    ordering_fields = ['roll_no', 'name', 'created_at']
    ordering = ['roll_no']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return StudentDetailSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return StudentCreateSerializer
        return StudentSerializer
    
    def get_queryset(self):
        queryset = Student.objects.select_related('class_ref', 'section', 'session')
        class_id = self.request.query_params.get('class_id')
        section_id = self.request.query_params.get('section_id')
        session_id = self.request.query_params.get('session_id')
        
        if class_id:
            queryset = queryset.filter(class_ref_id=class_id)
        if section_id:
            queryset = queryset.filter(section_id=section_id)
        if session_id:
            queryset = queryset.filter(session_id=session_id)
        
        return queryset
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'bulk_create']:
            return [IsAdminUser()]
        return [permissions.IsAuthenticated()]
    
    @action(detail=False, methods=['post'], url_path='bulk')
    def bulk_create(self, request):
        """Bulk create students."""
        serializer = BulkStudentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        students = serializer.save()
        return Response(
            StudentSerializer(students, many=True).data,
            status=status.HTTP_201_CREATED
        )


class TeacherViewSet(viewsets.ModelViewSet):
    """ViewSet for teachers."""
    queryset = Teacher.objects.all()
    serializer_class = TeacherSerializer
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['name', 'user__email']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    permission_classes = [IsAdminUser]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return TeacherCreateSerializer
        return TeacherSerializer
    
    def destroy(self, request, *args, **kwargs):
        """Delete teacher and associated user."""
        teacher = self.get_object()
        user = teacher.user
        teacher.delete()
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=True, methods=['post'], url_path='reset-password')
    def reset_password(self, request, pk=None):
        """Send password reset email (placeholder for actual implementation)."""
        teacher = self.get_object()
        # In production, implement actual password reset email
        return Response({
            'message': f'Password reset instructions sent to {teacher.email}'
        })


class AdminViewSet(viewsets.ModelViewSet):
    """ViewSet for admins (read-only for safety)."""
    queryset = Admin.objects.all()
    serializer_class = AdminSerializer
    permission_classes = [IsAdminUser]
    http_method_names = ['get', 'head', 'options']
