import asyncio
import aiohttp
import logging
import os
from datetime import datetime

logger = logging.getLogger(__name__)

class KeepAliveService:
    def __init__(self):
        self.base_url = os.getenv("BACKEND_URL", "https://your-backend-url.onrender.com")
        self.ping_interval = 30  # seconds
        self.is_running = False
        
    async def ping_backend(self):
        """Ping the backend to keep it awake"""
        try:
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=10)) as session:
                async with session.get(f"{self.base_url}/health") as response:
                    if response.status == 200:
                        logger.info(f"Keep-alive ping successful at {datetime.now()}")
                    else:
                        logger.warning(f"Keep-alive ping returned status {response.status}")
        except Exception as e:
            logger.error(f"Keep-alive ping failed: {e}")
    
    async def start_keep_alive(self):
        """Start the keep-alive loop"""
        if self.is_running:
            return
            
        self.is_running = True
        logger.info(f"Starting keep-alive service, pinging {self.base_url} every {self.ping_interval} seconds")
        
        while self.is_running:
            await self.ping_backend()
            await asyncio.sleep(self.ping_interval)
    
    def stop_keep_alive(self):
        """Stop the keep-alive loop"""
        self.is_running = False
        logger.info("Keep-alive service stopped")

# Global instance
keep_alive_service = KeepAliveService()