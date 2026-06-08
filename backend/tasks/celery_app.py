"""Celery application configuration."""

import os
from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")

app = Celery("rms")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks(["tasks"])

# Task configuration
app.conf.update(
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    worker_prefetch_multiplier=1,
    task_soft_time_limit=300,
    task_time_limit=600,
    task_default_queue="default",
    task_routes={
        "tasks.report_tasks.*": {"queue": "reports"},
        "tasks.ranking_tasks.*": {"queue": "compute"},
    },
)
