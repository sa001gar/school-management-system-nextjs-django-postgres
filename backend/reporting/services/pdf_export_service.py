"""PDF export service: generates PDF report cards and marksheets."""

from __future__ import annotations

from uuid import UUID
import io

import structlog
from shared.base_service import BaseService

logger = structlog.get_logger(__name__)


class PDFExportService(BaseService):
    """Generates PDF files for report cards and marksheets."""

    def generate_student_report_card_pdf(self, enrollment_id: UUID) -> io.BytesIO:
        """Generate a PDF report card for a single student."""
        from reporting.services.report_card_service import ReportCardService

        report_svc = ReportCardService()
        report = report_svc.generate_student_report_card(enrollment_id)

        buffer = io.BytesIO()
        try:
            from reportlab.lib.pagesizes import A4
            from reportlab.lib import colors
            from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
            from reportlab.lib.styles import getSampleStyleSheet

            doc = SimpleDocTemplate(buffer, pagesize=A4)
            styles = getSampleStyleSheet()
            elements = []

            # Header
            elements.append(Paragraph(
                f"Report Card - {report.session_name}",
                styles["Title"],
            ))
            elements.append(Spacer(1, 12))

            # Student Info
            info_data = [
                ["Student Name", report.student_name],
                ["Student ID", report.student_id],
                ["Roll No", report.roll_no],
                ["Class", f"{report.class_name} - {report.section_name}"],
            ]
            info_table = Table(info_data, colWidths=[120, 300])
            info_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (0, -1), colors.grey),
                ("TEXTCOLOR", (0, 0), (0, -1), colors.whitesmoke),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
            ]))
            elements.append(info_table)
            elements.append(Spacer(1, 20))

            # Results Table
            results_data = [["Subject", "Marks", "Max", "Percentage", "Grade"]]
            for result in report.results:
                results_data.append([
                    result.subject_id,
                    str(result.total_obtained),
                    str(result.total_full),
                    f"{result.percentage}%",
                    result.grade,
                ])

            # Totals row
            results_data.append([
                "TOTAL",
                str(report.total_marks),
                str(report.total_full),
                f"{report.percentage}%",
                report.overall_grade,
            ])

            results_table = Table(results_data, colWidths=[150, 80, 80, 100, 80])
            results_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2563eb")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
                ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#e0e7ff")),
                ("GRID", (0, 0), (-1, -1), 1, colors.black),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
            ]))
            elements.append(results_table)

            doc.build(elements)
            buffer.seek(0)
            return buffer

        except ImportError:
            self.log.error("reportlab_not_installed")
            raise RuntimeError("reportlab is required for PDF generation")


    def generate_class_report_cards_pdf(
        self,
        class_id: UUID,
        section_id: UUID,
        session_id: UUID,
    ) -> io.BytesIO:
        """Generate a multi-page PDF with all student report cards in a class."""
        from reporting.services.report_card_service import ReportCardService

        report_svc = ReportCardService()
        reports = report_svc.generate_class_report_cards(class_id, section_id, session_id)

        buffer = io.BytesIO()
        try:
            from reportlab.lib.pagesizes import A4
            from reportlab.lib import colors
            from reportlab.platypus import (
                SimpleDocTemplate, Table, TableStyle,
                Paragraph, Spacer, PageBreak,
            )
            from reportlab.lib.styles import getSampleStyleSheet

            doc = SimpleDocTemplate(buffer, pagesize=A4)
            styles = getSampleStyleSheet()
            elements = []

            for i, report in enumerate(reports):
                if i > 0:
                    elements.append(PageBreak())

                elements.append(Paragraph(
                    f"Report Card - {report.session_name}",
                    styles["Title"],
                ))
                elements.append(Spacer(1, 12))

                info_data = [
                    ["Student Name", report.student_name],
                    ["Student ID", report.student_id],
                    ["Roll No", report.roll_no],
                    ["Class", f"{report.class_name} - {report.section_name}"],
                ]
                info_table = Table(info_data, colWidths=[120, 300])
                info_table.setStyle(TableStyle([
                    ("BACKGROUND", (0, 0), (0, -1), colors.grey),
                    ("TEXTCOLOR", (0, 0), (0, -1), colors.whitesmoke),
                    ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                    ("TOPPADDING", (0, 0), (-1, -1), 8),
                ]))
                elements.append(info_table)
                elements.append(Spacer(1, 20))

                results_data = [["Subject", "Marks", "Max", "Percentage", "Grade"]]
                for result in report.results:
                    results_data.append([
                        result.subject_id,
                        str(result.total_obtained),
                        str(result.total_full),
                        f"{result.percentage}%",
                        result.grade,
                    ])
                results_data.append([
                    "TOTAL",
                    str(report.total_marks),
                    str(report.total_full),
                    f"{report.percentage}%",
                    report.overall_grade,
                ])

                results_table = Table(results_data, colWidths=[150, 80, 80, 100, 80])
                results_table.setStyle(TableStyle([
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2563eb")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
                    ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#e0e7ff")),
                    ("GRID", (0, 0), (-1, -1), 1, colors.black),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                    ("TOPPADDING", (0, 0), (-1, -1), 8),
                ]))
                elements.append(results_table)

            doc.build(elements)
            buffer.seek(0)
            return buffer

        except ImportError:
            self.log.error("reportlab_not_installed")
            raise RuntimeError("reportlab is required for PDF generation")
