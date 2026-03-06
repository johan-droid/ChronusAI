import asyncio
import httpx
import structlog
from datetime import datetime
import os

logger = structlog.get_logger()

class SelfPinger:
    def __init__(self, url: str, interval: int = 30):  # 30 seconds
        self.url = url
        self.interval = interval
        self.task = None
        self.is_healthy = True
        self.ping_count = 0
        
    async def ping(self):
        """Aggressively ping the service to prevent sleep"""
        while True:
            try:
                await asyncio.sleep(self.interval)
                self.ping_count += 1
                
                # Multiple endpoints to ping for better coverage
                endpoints = ["/health", "/api/v1/status", "/"]
                
                async with httpx.AsyncClient(timeout=15) as client:
                    for endpoint in endpoints:
                        try:
                            response = await client.get(f"{self.url}{endpoint}")
                            if response.status_code == 200:
                                self.is_healthy = True
                                logger.info(
                                    "Aggressive self-ping successful", 
                                    endpoint=endpoint,
                                    ping_count=self.ping_count,
                                    timestamp=datetime.utcnow().isoformat()
                                )
                                break  # Success, no need to ping other endpoints
                        except Exception as endpoint_error:
                            logger.warning(
                                "Endpoint ping failed, trying next", 
                                endpoint=endpoint, 
                                error=str(endpoint_error)
                            )
                            continue
                    else:
                        # All endpoints failed
                        self.is_healthy = False
                        logger.error("All self-ping endpoints failed", ping_count=self.ping_count)
                        
            except Exception as e:
                self.is_healthy = False
                logger.error("Self-ping critical error", error=str(e), ping_count=self.ping_count)
    
    def start(self):
        """Start the aggressive self-ping task"""
        if self.task is None:
            self.task = asyncio.create_task(self.ping())
            logger.info(
                "Aggressive self-ping started", 
                interval=self.interval, 
                url=self.url,
                message="Backend will stay awake with 30-second pings"
            )
    
    def stop(self):
        """Stop the self-ping task"""
        if self.task:
            self.task.cancel()
            self.task = None
            logger.info("Aggressive self-ping stopped", total_pings=self.ping_count)
