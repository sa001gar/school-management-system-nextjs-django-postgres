"""Result computation service: aggregates marks into SubjectResult."""

from __future__ import annotations

from uuid import UUID

import structlog
from django.db import transaction
from django.db.models import Sum

from shared.base_service import BaseService
from shared.exceptions import NotFoundException
from results.models import MarksEntry, SubjectResult
from results.repositories.result_repository import ResultRepository

logger = structlog.get_logger(__name__)


class ResultService(BaseService):
    """Computes and persists SubjectResult from MarksEntry data."""

    def __init__(self) -> None:
        self.repo = ResultRepository()

    @transaction.atomic
    def compute_subject_result(
        self,
        enrollment_id: UUID,
        subject_id: UUID,
    ) -> SubjectResult:
        """Compute aggregate marks for one enrollment+subject and upsert SubjectResult."""
        from academics.services.grading_service import GradingService

        agg = (
            MarksEntry.objects.filter(
                enrollment_id=enrollment_id,
                subject_id=subject_id,
            )
            .aggregate(
                total_obtained=Sum("obtained_marks"),
                total_full=Sum("full_marks"),
            )
        )

        total_obtained = agg["total_obtained"] or 0
        total_full = agg["total_full"] or 0

        if total_full == 0:
            percentage = 0.0
        else:
            percentage = round((total_obtained / total_full) * 100, 2)

        grading = GradingService()
        grade_label, grade_point = grading.calculate_grade(percentage)

        result, created = SubjectResult.objects.update_or_create(
            enrollment_id=enrollment_id,
            subject_id=subject_id,
            defaults={
                "total_obtained": total_obtained,
                "total_full": total_full,
                "percentage": percentage,
                "grade": grade_label,
                "grade_point": grade_point,
            },
        )

        self.log.info(
            "result.computed",
            enrollment_id=str(enrollment_id),
            subject_id=str(subject_id),
            percentage=percentage,
            grade=grade_label,
        )
        return result

    @transaction.atomic
    def compute_all_results(self, enrollment_id: UUID) -> list[SubjectResult]:
        """Recompute results for all subjects of a given enrollment."""
        subjects_with_marks = (
            MarksEntry.objects.filter(enrollment_id=enrollment_id)
            .values_list("subject_id", flat=True)
            .distinct()
        )

        results = []
        for subject_id in subjects_with_marks:
            result = self.compute_subject_result(enrollment_id, subject_id)
            results.append(result)

        self.log.info(
            "result.all_computed",
            enrollment_id=str(enrollment_id),
            count=len(results),
        )
        return results

    @transaction.atomic
    def refresh_all_results(self, session_id: UUID) -> int:
        """Recompute all results for every enrollment in a session. Returns count."""
        from enrollments.models import Enrollment

        enrollment_ids = (
            Enrollment.objects.filter(
                session_id=session_id,
                status="active",
            )
            .values_list("id", flat=True)
        )

        count = 0
        for enrollment_id in enrollment_ids:
            self.compute_all_results(enrollment_id)
            count += 1

        self.log.info(
            "result.refresh_all",
            session_id=str(session_id),
            enrollments_processed=count,
        )
        return count
