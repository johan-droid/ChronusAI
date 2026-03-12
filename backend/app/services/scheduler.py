from __future__ import annotations

import logging
from datetime import datetime
from typing import Callable, Any

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore
from apscheduler.executors.asyncio import AsyncIOExecutor
from apscheduler.executors.pool import ThreadPoolExecutor
from app.config import settings
from apscheduler.job import Job

logger = logging.getLogger(__name__)

_scheduler: AsyncIOScheduler | None = None


def get_scheduler() -> AsyncIOScheduler:
    global _scheduler
    if _scheduler is None:
        # Configure persistent job store using application's database URL
        jobstore_url = getattr(settings, 'database_url', None)
        jobstores = {}
        if jobstore_url:
            jobstores = {
                'default': SQLAlchemyJobStore(url=jobstore_url)
            }

        executors = {
            'default': AsyncIOExecutor(),
            'threadpool': ThreadPoolExecutor(10)
        }

        job_defaults = {
            'coalesce': False,
            'max_instances': 3,
        }

        _scheduler = AsyncIOScheduler(jobstores=jobstores, executors=executors, job_defaults=job_defaults, timezone='UTC')
    return _scheduler


def start_scheduler():
    sched = get_scheduler()
    if not sched.running:
        sched.start()
        logger.info("APScheduler started")


def shutdown_scheduler():
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("APScheduler shutdown")
        _scheduler = None


def remove_job(job_id: str) -> None:
    """Remove a scheduled job by id if it exists."""
    sched = get_scheduler()
    try:
        sched.remove_job(job_id)
        logger.info("Removed scheduled job", job_id=job_id)
    except Exception:
        logger.debug("No job to remove or failed to remove", job_id=job_id)


def schedule_job(func: Callable[..., Any], run_date: datetime, args: list[Any] | None = None, kwargs: dict | None = None, id: str | None = None) -> Job:
    """Schedule a one-off job to run at run_date. Returns the Job."""
    sched = get_scheduler()
    job = sched.add_job(func, "date", run_date=run_date, args=args or [], kwargs=kwargs or {}, id=id)
    logger.info("Scheduled job", job_id=job.id, run_date=run_date.isoformat())
    return job
