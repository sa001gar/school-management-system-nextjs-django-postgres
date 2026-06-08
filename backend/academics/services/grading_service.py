"""Service for GradePolicy operations."""

from __future__ import annotations

from uuid import UUID
from decimal import Decimal

from django.db.models import QuerySet

from academics.models import GradePolicy
from shared.base_service import BaseService
from shared.exceptions import ConflictException, NotFoundException


class GradingService(BaseService):
    """Business logic for grading policy management."""

    def calculate_grade(self, percentage: float) -> tuple[str, float]:
        """Calculate grade label and grade point from percentage."""
        policies = GradePolicy.objects.filter(is_active=True).order_by("-min_percentage")
        for policy in policies:
            if policy.min_percentage <= Decimal(str(percentage)) <= policy.max_percentage:
                self.log.info(
                    "grade.calculated",
                    percentage=percentage,
                    label=policy.grade_label,
                )
                return policy.grade_label, float(policy.grade_point)
        self.log.warning("grade.not_found", percentage=percentage)
        return "N/A", 0.0

    def get_all_policies(self) -> QuerySet[GradePolicy]:
        return GradePolicy.objects.filter(is_active=True).order_by("display_order")

    def upsert_policy(
        self,
        grade_label: str,
        min_percentage: float,
        max_percentage: float,
        grade_point: float,
        display_order: int,
    ) -> GradePolicy:
        existing = GradePolicy.objects.filter(grade_label=grade_label).first()
        if existing:
            existing.min_percentage = min_percentage
            existing.max_percentage = max_percentage
            existing.grade_point = grade_point
            existing.display_order = display_order
            existing.save()
            self.log.info("grade_policy.update", grade_label=grade_label)
            return existing
        self.log.info("grade_policy.create", grade_label=grade_label)
        return GradePolicy.objects.create(
            grade_label=grade_label,
            min_percentage=min_percentage,
            max_percentage=max_percentage,
            grade_point=grade_point,
            display_order=display_order,
        )
