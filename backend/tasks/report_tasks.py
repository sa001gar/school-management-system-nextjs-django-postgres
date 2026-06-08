"""Celery tasks for report generation."""

from __future__ import annotations

import structlog
from tasks.celery_app import app

logger = structlog.get_logger(__name__)


@app.task(bind=True, queue="reports", max_retries=3, default_retry_delay=60)
def generate_student_report_card(self, enrollment_id: str) -> dict:
    """Generate report card for a single student."""
    try:
        from reporting.services.report_card_service import ReportCardService
        service = ReportCardService()
        result = service.generate_student_report_card(enrollment_id)
        logger.info("task.report_card.success", enrollment_id=enrollment_id)
        return {"status": "success", "enrollment_id": enrollment_id}
    except Exception as exc:
        logger.error("task.report_card.failed", enrollment_id=enrollment_id, error=str(exc))
        raise self.retry(exc=exc)


@app.task(bind=True, queue="reports", max_retries=3, default_retry_delay=60)
def generate_class_report_cards(self, class_id: str, section_id: str, session_id: str) -> dict:
    """Generate report cards for all students in a class."""
    try:
        from reporting.services.report_card_service import ReportCardService
        service = ReportCardService()
        results = service.generate_class_report_cards(class_id, section_id, session_id)
        logger.info("task.class_report_cards.success", class_id=class_id, count=len(results))
        return {"status": "success", "count": len(results)}
    except Exception as exc:
        logger.error("task.class_report_cards.failed", class_id=class_id, error=str(exc))
        raise self.retry(exc=exc)


@app.task(bind=True, queue="reports", max_retries=3, default_retry_delay=60)
def generate_class_marksheet(self, class_id: str, section_id: str, session_id: str) -> dict:
    """Generate class-wide marksheet."""
    try:
        from reporting.services.marksheet_service import MarksheetService
        service = MarksheetService()
        results = service.generate_class_marksheet(class_id, section_id, session_id)
        logger.info("task.class_marksheet.success", class_id=class_id, count=len(results))
        return {"status": "success", "count": len(results)}
    except Exception as exc:
        logger.error("task.class_marksheet.failed", class_id=class_id, error=str(exc))
        raise self.retry(exc=exc)
