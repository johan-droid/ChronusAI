import asyncio
import httpx
import structlog
from datetime import datetime

logger = structlog.get_logger()

class SelfPinger:
    def __init__(self, url: str, interval: int = 300):  # 5 minutes - aggressive
        self.url = url
        self.interval = interval
        self.task = None
        self.is_healthy = True
        
    async def ping(self):
        """Ping the service aggressively to prevent sleep"""
        while True:
            try:
                await asyncio.sleep(self.interval)
                async with httpx.AsyncClient() as client:
                    response = await client.get(f"{self.url}/health", timeout=10)
                    if response.status_code == 200:
                        self.is_healthy = True
                        logger.info("Self-ping successful", timestamp=datetime.utcnow().isoformat())
                    else:
                        self.is_healthy = False
                        logger.warning("Self-ping failed", status_code=response.status_code)
            except Exception as e:
                self.is_healthy = False
                logger.error("Self-ping error", error=str(e))
    
    def start(self):
        """Start the self-ping task"""
        if self.task is None:
            self.task = asyncio.create_task(self.ping())
            logger.info("Self-ping started", interval=self.interval)
    
    def stop(self):
        """Stop the self-ping task"""
        if self.task:
            self.task.cancel()
            self.task = None
            logger.info("Self-ping stopped")
