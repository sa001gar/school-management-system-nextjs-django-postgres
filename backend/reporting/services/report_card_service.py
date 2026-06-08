"""ReportCard service: generates individual student report cards."""

from __future__ import annotations

from uuid import UUID
from decimal import Decimal

import structlog
from django.db.models import Sum

from shared.base_service import BaseService
from shared.types import ReportCardDTO, SubjectResultDTO
from results.models import SubjectResult
from results.services.result_service import ResultService

logger = structlog.get_logger(__name__)


class ReportCardService(BaseService):
    """Generates report card data for students."""

    def __init__(self) -> None:
        self._result_service = ResultService()

    def generate_student_report_card(
        self,
        enrollment_id: UUID,
    ) -> ReportCardDTO:
        """Generate a report card for a single student enrollment."""
        from enrollments.models import Enrollment

        enrollment = (
            Enrollment.objects.select_related(
                "student", "session", "class_field", "section"
            )
            .get(id=enrollment_id)
        )

        results = list(
            SubjectResult.objects.filter(enrollment=enrollment)
            .select_related("subject")
            .order_by("subject__code")
        )

        total_marks = sum(r.total_obtained for r in results)
        total_full = sum(r.total_full for r in results)
        percentage = (
            Decimal(str(round((total_marks / total_full) * 100, 2)))
            if total_full > 0
            else Decimal("0")
        )

        from academics.services.grading_service import GradingService

        grading = GradingService()
        overall_grade, _ = grading.calculate_grade(float(percentage))

        subject_results = [
            SubjectResultDTO(
                id=r.id,
                enrollment_id=r.enrollment_id,
                subject_id=r.subject_id,
                total_obtained=r.total_obtained,
                total_full=r.total_full,
                percentage=r.percentage,
                grade=r.grade,
                grade_point=r.grade_point,
            )
            for r in results
        ]

        report = ReportCardDTO(
            student_name=enrollment.student.name,
            student_id=enrollment.student.student_id,
            roll_no=enrollment.roll_no,
            class_name=enrollment.class_field.name,
            section_name=enrollment.section.name,
            session_name=enrollment.session.name,
            results=subject_results,
            total_marks=total_marks,
            total_full=total_full,
            percentage=percentage,
            overall_grade=overall_grade,
        )

        self.log.info(
            "report_card.generated",
            enrollment_id=str(enrollment_id),
            percentage=percentage,
        )
        return report

    def generate_class_report_cards(
        self,
        class_id: UUID,
        section_id: UUID,
        session_id: UUID,
    ) -> list[ReportCardDTO]:
        """Generate report cards for all students in a class-section-session."""
        from enrollments.models import Enrollment

        enrollments = (
            Enrollment.objects.filter(
                class_field_id=class_id,
                section_id=section_id,
                session_id=session_id,
                status="active",
            )
            .select_related("student")
            .order_by("roll_no")
        )

        reports = []
        for enrollment in enrollments:
            report = self.generate_student_report_card(enrollment.id)
            reports.append(report)

        self.log.info(
            "report_cards.class_generated",
            class_id=str(class_id),
            section_id=str(section_id),
            count=len(reports),
        )
        return reports
