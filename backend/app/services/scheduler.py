from __future__ import annotations

from datetime import datetime
from typing import Callable, Any

from apscheduler.executors.asyncio import AsyncIOExecutor
from apscheduler.executors.pool import ThreadPoolExecutor
from apscheduler.job import Job
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import create_engine, inspect
from sqlalchemy.engine import make_url
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.schema import CreateSchema
import structlog

from app.config import settings

logger = structlog.get_logger(__name__)

_scheduler: AsyncIOScheduler | None = None

JOBSTORE_SCHEMA = "scheduler_jobs"
JOBSTORE_TABLE = "apscheduler_jobs"


def _normalise_jobstore_url(raw_url: str) -> str:
    """Ensure the SQLAlchemyJobStore always receives a synchronous driver URL."""
    try:
        sa_url = make_url(raw_url)
    except Exception:
        return raw_url.replace("+asyncpg", "").replace("+aiosqlite", "")

    driver = sa_url.drivername
    if driver.endswith("+asyncpg"):
        sa_url = sa_url.set(drivername="postgresql+psycopg")
    elif driver.endswith("+aiosqlite"):
        sa_url = sa_url.set(drivername="sqlite")

    # APScheduler's SQLAlchemyJobStore uses a synchronous engine (psycopg/psycopg2).
    # Supabase pooler requires SSL for sync connections, so enforce sslmode=require
    # when not explicitly provided.
    backend = sa_url.get_backend_name()
    host = (sa_url.host or "").lower()
    if backend == "postgresql" and "pooler.supabase.com" in host:
        existing_query = dict(sa_url.query)
        lowered_keys = {str(k).lower() for k in existing_query.keys()}
        if "sslmode" not in lowered_keys:
            existing_query["sslmode"] = "require"
            sa_url = sa_url.set(query=existing_query)

    return str(sa_url)


def _ensure_jobstore_schema(sync_url: str, schema_name: str) -> None:
    """Create the schema used for APScheduler if it does not already exist."""
    engine = create_engine(sync_url, pool_pre_ping=True)
    try:
        with engine.begin() as conn:
            inspector = inspect(conn)
            if schema_name not in inspector.get_schema_names():
                conn.execute(CreateSchema(schema_name))
    finally:
        engine.dispose()


def get_scheduler() -> AsyncIOScheduler:
    global _scheduler
    if _scheduler is None:
        # Configure persistent job store using application's database URL
        jobstore_url = getattr(settings, 'database_url', None)
        jobstores = {}
        if jobstore_url:
            sync_jobstore_url = _normalise_jobstore_url(jobstore_url)
            try:
                _ensure_jobstore_schema(sync_jobstore_url, JOBSTORE_SCHEMA)
            except SQLAlchemyError:
                logger.exception("failed_creating_scheduler_schema", schema=JOBSTORE_SCHEMA)
            else:
                logger.info(
                    "APScheduler jobstore schema ready",
                    schema=JOBSTORE_SCHEMA,
                    table=JOBSTORE_TABLE,
                )

            jobstores = {
                'default': SQLAlchemyJobStore(
                    url=sync_jobstore_url,
                    tablename=JOBSTORE_TABLE,
                    tableschema=JOBSTORE_SCHEMA,
                )
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
