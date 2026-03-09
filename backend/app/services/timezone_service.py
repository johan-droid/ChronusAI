"""Timezone detection service using IP geolocation."""

import httpx
from typing import Optional
import structlog

logger = structlog.get_logger()


class TimezoneDetectionService:
    """Service to detect user's timezone from their IP address."""
    
    # Free IP geolocation services
    IP_API_URL = "http://ip-api.com/json/{ip}?fields=status,message,timezone,query"
    IPINFO_URL = "https://ipinfo.io/{ip}/json"
    
    @staticmethod
    def get_client_ip(request_headers: dict, forwarded_for: Optional[str] = None) -> str:
        """
        Extract client IP from request headers.
        Handles various proxy and load balancer scenarios.
        """
        # Check X-Forwarded-For header (common for proxies/load balancers)
        if forwarded_for:
            # X-Forwarded-For can contain multiple IPs, take the first one
            ips = [ip.strip() for ip in forwarded_for.split(",")]
            client_ip = ips[0] if ips else ""
        else:
            client_ip = ""
        
        # If no forwarded IP, try other common headers
        if not client_ip or client_ip.lower() == "unknown":
            client_ip = request_headers.get("x-real-ip", "")
        
        if not client_ip:
            client_ip = request_headers.get("cf-connecting-ip", "")  # Cloudflare
        
        if not client_ip:
            client_ip = request_headers.get("x-client-ip", "")
            
        # Default to localhost if no IP found
        if not client_ip:
            client_ip = "127.0.0.1"
            
        return client_ip
    
    @classmethod
    async def detect_timezone_from_ip(cls, ip_address: str) -> Optional[str]:
        """
        Detect timezone from IP address using geolocation API.
        Returns timezone string or None if detection fails.
        """
        # Skip for localhost/private IPs
        if ip_address in ("127.0.0.1", "localhost", "::1") or \
           ip_address.startswith("192.168.") or \
           ip_address.startswith("10.") or \
           ip_address.startswith("172."):
            logger.info("local_or_private_ip_detected", ip=ip_address)
            return None
        
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                # Try ip-api.com (free, no API key needed)
                url = cls.IP_API_URL.format(ip=ip_address)
                response = await client.get(url)
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("status") == "success":
                        timezone = data.get("timezone")
                        logger.info(
                            "timezone_detected_from_ip",
                            ip=ip_address,
                            timezone=timezone,
                            provider="ip-api"
                        )
                        return timezone
                    else:
                        logger.warning(
                            "ip_api_lookup_failed",
                            ip=ip_address,
                            message=data.get("message")
                        )
                
                # Fallback to ipinfo.io if ip-api fails
                url = cls.IPINFO_URL.format(ip=ip_address)
                response = await client.get(url)
                
                if response.status_code == 200:
                    data = response.json()
                    # ipinfo returns timezone in the format "America/New_York"
                    timezone = data.get("timezone")
                    if timezone:
                        logger.info(
                            "timezone_detected_from_ip",
                            ip=ip_address,
                            timezone=timezone,
                            provider="ipinfo"
                        )
                        return timezone
                        
        except Exception as e:
            logger.error(
                "timezone_detection_failed",
                ip=ip_address,
                error=str(e)
            )
        
        return None
    
    @classmethod
    async def detect_and_update_user_timezone(
        cls,
        user,
        request_headers: dict,
        forwarded_for: Optional[str] = None
    ) -> Optional[str]:
        """
        Detect timezone from request and update user if different.
        Returns the detected timezone or the user's current timezone.
        """
        # Get client IP
        client_ip = cls.get_client_ip(request_headers, forwarded_for)
        
        # Try to detect timezone from IP
        detected_tz = await cls.detect_timezone_from_ip(client_ip)
        
        if detected_tz and detected_tz != user.timezone:
            logger.info(
                "updating_user_timezone",
                user_id=str(user.id),
                old_timezone=user.timezone,
                new_timezone=detected_tz,
                ip=client_ip
            )
            return detected_tz
        
        # Return existing timezone if detection failed or matches
        return user.timezone if user.timezone else "UTC"
