"""Celery tasks for ranking computation."""

from __future__ import annotations

import structlog
from tasks.celery_app import app

logger = structlog.get_logger(__name__)


@app.task(bind=True, queue="compute", max_retries=3, default_retry_delay=120)
def compute_class_rankings(self, session_id: str, class_id: str | None = None) -> dict:
    """Compute rankings for a session/class (all sections)."""
    try:
        from reporting.services.ranking_service import RankingService
        from academics.models import Section

        service = RankingService()
        total = 0

        if class_id:
            sections = Section.objects.filter(class_ref_id=class_id)
            for section in sections:
                results = service.compute_class_rankings(class_id, str(section.id), session_id)
                total += len(results)
        else:
            from academics.models import Class
            classes = Class.objects.filter(is_active=True)
            for cls in classes:
                sections = Section.objects.filter(class_ref=cls)
                for section in sections:
                    results = service.compute_class_rankings(str(cls.id), str(section.id), session_id)
                    total += len(results)

        logger.info("task.rankings.success", session_id=session_id, count=total)
        return {"status": "success", "count": total}
    except Exception as exc:
        logger.error("task.rankings.failed", session_id=session_id, error=str(exc))
        raise self.retry(exc=exc)


@app.task(bind=True, queue="compute", max_retries=3, default_retry_delay=60)
def refresh_subject_results(self, session_id: str) -> dict:
    """Recompute all subject_results from marks_entries for a session."""
    try:
        from results.services.result_service import ResultService
        service = ResultService()
        count = service.refresh_all_results(session_id)
        logger.info("task.refresh_results.success", session_id=session_id, count=count)
        return {"status": "success", "count": count}
    except Exception as exc:
        logger.error("task.refresh_results.failed", session_id=session_id, error=str(exc))
        raise self.retry(exc=exc)
