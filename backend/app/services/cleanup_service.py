import asyncio
from datetime import datetime, timezone, timedelta
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession
import structlog
from app.db.session import AsyncSessionLocal as SessionLocal
from app.models.meeting import Meeting

logger = structlog.get_logger()

class CleanupService:
    @staticmethod
    async def cleanup_old_meetings():
        """Delete meetings older than 7 days from the database."""
        async with SessionLocal() as db:
            try:
                retention_limit = datetime.now(timezone.utc) - timedelta(days=7)
                
                # Use delete statement for efficiency
                stmt = delete(Meeting).where(Meeting.start_time < retention_limit)
                result = await db.execute(stmt)
                await db.commit()
                
                deleted_count = result.rowcount
                if deleted_count > 0:
                    logger.info("database_cleanup_success", 
                                deleted_rows=deleted_count, 
                                threshold_date=retention_limit.isoformat())
                else:
                    logger.debug("database_cleanup_no_old_records", threshold_date=retention_limit.isoformat())
                    
            except Exception as e:
                logger.error("database_cleanup_failed", error=str(e), exc_info=True)
                await db.rollback()

async def run_cleanup_task(interval_hours: int = 24):
    """Background task that runs the database cleanup periodically."""
    logger.info("cleanup_task_started", interval_hours=interval_hours)
    while True:
        try:
            await CleanupService.cleanup_old_meetings()
        except Exception as e:
            logger.error("cleanup_task_error", error=str(e))
        
        # Wait for the next interval
        await asyncio.sleep(interval_hours * 3600)
