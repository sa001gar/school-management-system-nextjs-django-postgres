"""DRF views for PDF and Excel export."""

from uuid import UUID

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from core.permissions import IsAdmin
from reporting.services.pdf_export_service import PDFExportService
from reporting.services.excel_export_service import ExcelExportService


class PDFReportCardView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request, enrollment_id):
        try:
            service = PDFExportService()
            pdf_buffer = service.generate_student_report_card_pdf(UUID(enrollment_id))

            from django.http import HttpResponse
            response = HttpResponse(pdf_buffer.getvalue(), content_type="application/pdf")
            response["Content-Disposition"] = f'attachment; filename="report_card_{enrollment_id}.pdf"'
            return response
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class PDFClassReportCardsView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        class_id = request.query_params.get("class_id")
        section_id = request.query_params.get("section_id")
        session_id = request.query_params.get("session_id")

        if not all([class_id, section_id, session_id]):
            return Response(
                {"error": "class_id, section_id, and session_id are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            service = PDFExportService()
            pdf_buffer = service.generate_class_report_cards_pdf(
                UUID(class_id), UUID(section_id), UUID(session_id)
            )

            from django.http import HttpResponse
            response = HttpResponse(pdf_buffer.getvalue(), content_type="application/pdf")
            response["Content-Disposition"] = f'attachment; filename="class_report_cards.pdf"'
            return response
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ExcelMarksheetView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request, enrollment_id):
        try:
            service = ExcelExportService()
            excel_buffer = service.generate_student_marksheet_excel(UUID(enrollment_id))

            from django.http import HttpResponse
            response = HttpResponse(
                excel_buffer.getvalue(),
                content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )
            response["Content-Disposition"] = f'attachment; filename="marksheet_{enrollment_id}.xlsx"'
            return response
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ExcelClassMarksheetView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        class_id = request.query_params.get("class_id")
        section_id = request.query_params.get("section_id")
        session_id = request.query_params.get("session_id")

        if not all([class_id, section_id, session_id]):
            return Response(
                {"error": "class_id, section_id, and session_id are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            service = ExcelExportService()
            excel_buffer = service.generate_class_marksheet_excel(
                UUID(class_id), UUID(section_id), UUID(session_id)
            )

            from django.http import HttpResponse
            response = HttpResponse(
                excel_buffer.getvalue(),
                content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )
            response["Content-Disposition"] = f'attachment; filename="class_marksheet.xlsx"'
            return response
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
