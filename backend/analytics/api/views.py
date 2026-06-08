"""API views for analytics module."""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import serializers

from core.permissions import IsAdmin
from analytics.services.analytics_service import AnalyticsService


class PassFailRatioView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        session_id = request.query_params.get("session_id")
        class_id = request.query_params.get("class_id")

        if not session_id:
            return Response({"error": "session_id is required"}, status=400)

        service = AnalyticsService()
        result = service.get_pass_fail_ratio(
            session_id=session_id,
            class_id=class_id,
        )
        return Response(result)


class SubjectDifficultyView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        session_id = request.query_params.get("session_id")
        class_id = request.query_params.get("class_id")

        if not session_id:
            return Response({"error": "session_id is required"}, status=400)

        service = AnalyticsService()
        result = service.get_subject_difficulty(
            session_id=session_id,
            class_id=class_id,
        )
        return Response(result)


class GradeDistributionView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        session_id = request.query_params.get("session_id")
        class_id = request.query_params.get("class_id")

        if not session_id:
            return Response({"error": "session_id is required"}, status=400)

        service = AnalyticsService()
        result = service.get_grade_distribution(
            session_id=session_id,
            class_id=class_id,
        )
        return Response(result)


class TopPerformersView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        session_id = request.query_params.get("session_id")
        class_id = request.query_params.get("class_id")
        limit = int(request.query_params.get("limit", 10))

        if not session_id:
            return Response({"error": "session_id is required"}, status=400)

        service = AnalyticsService()
        result = service.get_top_performers(
            session_id=session_id,
            class_id=class_id,
            limit=limit,
        )
        return Response(result)


class BottomPerformersView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        session_id = request.query_params.get("session_id")
        class_id = request.query_params.get("class_id")
        limit = int(request.query_params.get("limit", 10))

        if not session_id:
            return Response({"error": "session_id is required"}, status=400)

        service = AnalyticsService()
        result = service.get_bottom_performers(
            session_id=session_id,
            class_id=class_id,
            limit=limit,
        )
        return Response(result)


class SessionComparisonView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        session_ids = request.query_params.getlist("session_ids", [])

        if not session_ids:
            return Response({"error": "session_ids is required"}, status=400)

        service = AnalyticsService()
        result = service.get_session_comparison(session_ids)
        return Response(result)


class ClassPerformanceView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        session_id = request.query_params.get("session_id")

        if not session_id:
            return Response({"error": "session_id is required"}, status=400)

        service = AnalyticsService()
        result = service.get_class_performance(session_id)
        return Response(result)
