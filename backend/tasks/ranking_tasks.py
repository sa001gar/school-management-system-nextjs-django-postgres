"""Celery tasks for ranking computation."""

from __future__ import annotations

import structlog
from tasks.celery_app import app

logger = structlog.get_logger(__name__)


@app.task(bind=True, queue="compute", max_retries=3, default_retry_delay=120)
def compute_class_rankings(self, session_id: str, class_id: str | None = None) -> dict:
    """Compute rankings for a session/class."""
    try:
        from reporting.services.ranking_service import RankingService
        service = RankingService()
        if class_id:
            results = service.compute_class_rankings(class_id, None, session_id)
        else:
            # Compute for all classes in session
            from academics.selectors.session_selector import SessionSelector
            from academics.selectors.class_selector import ClassSelector
            class_sel = ClassSelector()
            classes = class_sel.list_ordered()
            total = 0
            for cls in classes:
                results = service.compute_class_rankings(str(cls.id), None, session_id)
                total += len(results)
            return {"status": "success", "total_ranked": total}
        logger.info("task.rankings.success", session_id=session_id, count=len(results))
        return {"status": "success", "count": len(results)}
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
