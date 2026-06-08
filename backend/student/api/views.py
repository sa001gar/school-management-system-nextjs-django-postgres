"""Student Portal views: profile, results, report card, marksheet, ranking, enrollment history."""

from uuid import UUID

from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsStudent
from enrollments.models import Student, Enrollment
from results.models import SubjectResult
from reporting.services.ranking_service import RankingService
from reporting.services.report_card_service import ReportCardService
from reporting.services.marksheet_service import MarksheetService

from .serializers import (
    StudentProfileSerializer,
    SubjectResultSerializer,
    ReportCardSerializer,
    MarksheetSerializer,
    RankingSerializer,
    EnrollmentHistorySerializer,
)


class StudentProfileView(APIView):
    """GET /student/profile/ - Current student's profile with enrollment and parent info."""

    permission_classes = [IsAuthenticated, IsStudent]

    def get(self, request):
        student = get_object_or_404(Student, user=request.user)

        current_enrollment = (
            Enrollment.objects.filter(student=student, status="active")
            .select_related("session", "class_field", "section")
            .order_by("-created_at")
            .first()
        )

        enrollment_data = None
        if current_enrollment:
            enrollment_data = {
                "enrollment_id": str(current_enrollment.id),
                "session": current_enrollment.session.name,
                "class": current_enrollment.class_field.name,
                "section": current_enrollment.section.name,
                "roll_no": current_enrollment.roll_no,
                "status": current_enrollment.status,
            }

        parent_info = {
            "father_name": student.father_name,
            "mother_name": student.mother_name,
            "guardian_name": student.guardian_name,
            "guardian_relation": student.guardian_relation,
            "phone": student.phone,
            "alternate_phone": student.alternate_phone,
        }

        data = {
            "student_id": student.student_id,
            "name": student.name,
            "date_of_birth": student.date_of_birth,
            "father_name": student.father_name,
            "mother_name": student.mother_name,
            "guardian_name": student.guardian_name,
            "guardian_relation": student.guardian_relation,
            "phone": student.phone,
            "alternate_phone": student.alternate_phone,
            "email": student.email,
            "profile_pic": student.profile_pic.url if student.profile_pic else None,
            "address": student.address,
            "admission_date": student.admission_date,
            "is_active": student.is_active,
            "current_enrollment": enrollment_data,
            "parent_info": parent_info,
        }

        serializer = StudentProfileSerializer(data)
        return Response(serializer.data)


class StudentResultsView(APIView):
    """GET /student/results/?session_id=X - Subject-wise results for the student."""

    permission_classes = [IsAuthenticated, IsStudent]

    def get(self, request):
        student = get_object_or_404(Student, user=request.user)
        session_id = request.query_params.get("session_id")

        if not session_id:
            return Response(
                {"error": "session_id query parameter is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            session_uuid = UUID(session_id)
        except (ValueError, AttributeError):
            return Response(
                {"error": "Invalid session_id format."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        enrollment = get_object_or_404(
            Enrollment,
            student=student,
            session_id=session_uuid,
        )

        results = (
            SubjectResult.objects.filter(enrollment=enrollment)
            .select_related("subject")
            .order_by("subject__code")
        )

        serializer = SubjectResultSerializer(results, many=True)
        return Response(serializer.data)


class StudentReportCardView(APIView):
    """GET /student/report-card/?session_id=X - Full report card for the student."""

    permission_classes = [IsAuthenticated, IsStudent]

    def get(self, request):
        student = get_object_or_404(Student, user=request.user)
        session_id = request.query_params.get("session_id")

        if not session_id:
            return Response(
                {"error": "session_id query parameter is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            session_uuid = UUID(session_id)
        except (ValueError, AttributeError):
            return Response(
                {"error": "Invalid session_id format."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        enrollment = get_object_or_404(
            Enrollment,
            student=student,
            session_id=session_uuid,
        )

        service = ReportCardService()
        report = service.generate_student_report_card(enrollment.id)

        serializer = ReportCardSerializer(report)
        return Response(serializer.data)


class StudentMarksheetView(APIView):
    """GET /student/marksheet/?session_id=X - Detailed marksheet for the student."""

    permission_classes = [IsAuthenticated, IsStudent]

    def get(self, request):
        student = get_object_or_404(Student, user=request.user)
        session_id = request.query_params.get("session_id")

        if not session_id:
            return Response(
                {"error": "session_id query parameter is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            session_uuid = UUID(session_id)
        except (ValueError, AttributeError):
            return Response(
                {"error": "Invalid session_id format."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        enrollment = get_object_or_404(
            Enrollment,
            student=student,
            session_id=session_uuid,
        )

        service = MarksheetService()
        marksheet = service.generate_student_marksheet(enrollment.id)

        serializer = MarksheetSerializer(marksheet)
        return Response(serializer.data)


class StudentRankingView(APIView):
    """GET /student/ranking/?session_id=X - Student's rank, percentage, and grade."""

    permission_classes = [IsAuthenticated, IsStudent]

    def get(self, request):
        student = get_object_or_404(Student, user=request.user)
        session_id = request.query_params.get("session_id")

        if not session_id:
            return Response(
                {"error": "session_id query parameter is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            session_uuid = UUID(session_id)
        except (ValueError, AttributeError):
            return Response(
                {"error": "Invalid session_id format."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        service = RankingService()
        ranking = service.get_student_rank(
            student_id=student.id,
            session_id=session_uuid,
        )

        serializer = RankingSerializer(ranking)
        return Response(serializer.data)


class StudentEnrollmentHistoryView(APIView):
    """GET /student/enrollment-history/ - All past enrollments for the student."""

    permission_classes = [IsAuthenticated, IsStudent]

    def get(self, request):
        student = get_object_or_404(Student, user=request.user)

        enrollments = (
            Enrollment.objects.filter(student=student)
            .select_related("session", "class_field", "section")
            .order_by("-created_at")
        )

        serializer = EnrollmentHistorySerializer(enrollments, many=True)
        return Response(serializer.data)
