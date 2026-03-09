"""Timezone detection service with Indian context support."""

import httpx
from typing import Optional, Dict, Any
import structlog

logger = structlog.get_logger()


class TimezoneDetectionService:
    """Service to detect user's timezone and cultural context from their IP address."""
    
    # Free IP geolocation services
    IP_API_URL = "http://ip-api.com/json/{ip}?fields=status,message,timezone,countryCode,country,query"
    IPINFO_URL = "https://ipinfo.io/{ip}/json"
    
    # Indian timezones
    INDIAN_TIMEZONES = {
        'Asia/Kolkata',
        'Asia/Calcutta',
        'Asia/Delhi',
        'Asia/Mumbai',
        'Asia/Bangalore',
        'Asia/Chennai'
    }
    
    # Indian festivals and holidays (simplified)
    INDIAN_FESTIVALS = {
        'Diwali': ['2024-11-01', '2025-10-21', '2026-11-10'],
        'Holi': ['2024-03-25', '2025-03-14', '2026-03-04'],
        'Dussehra': ['2024-10-24', '2025-10-13', '2026-10-02'],
        'Raksha Bandhan': ['2024-08-19', '2025-08-08', '2026-07-28'],
        'Eid': ['2024-04-10', '2025-03-31', '2026-03-21'],
        'Christmas': ['2024-12-25', '2025-12-25', '2026-12-25'],
        'New Year': ['2024-01-01', '2025-01-01', '2026-01-01'],
        'Independence Day': ['2024-08-15', '2025-08-15', '2026-08-15'],
        'Republic Day': ['2024-01-26', '2025-01-26', '2026-01-26']
    }
    
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
    async def detect_timezone_from_ip(cls, ip_address: str) -> Optional[Dict[str, Any]]:
        """
        Detect timezone and cultural context from IP address using geolocation API.
        Returns dictionary with timezone, country, and cultural context.
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
                        country_code = data.get("countryCode", "")
                        country = data.get("country", "")
                        
                        # Detect Indian context
                        is_indian = cls.is_indian_context(timezone, country_code, country)
                        
                        result = {
                            "timezone": timezone,
                            "country_code": country_code,
                            "country": country,
                            "is_indian": is_indian,
                            "cultural_context": "indian" if is_indian else "global"
                        }
                        
                        logger.info(
                            "timezone_and_context_detected",
                            ip=ip_address,
                            timezone=timezone,
                            country=country_code,
                            is_indian=is_indian,
                            provider="ip-api"
                        )
                        return result
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
                    # ipinfo returns timezone in format "America/New_York"
                    timezone = data.get("timezone")
                    country = data.get("country", "")
                    country_code = data.get("country", "")
                    
                    if timezone:
                        is_indian = cls.is_indian_context(timezone, country_code, country)
                        
                        result = {
                            "timezone": timezone,
                            "country_code": country_code,
                            "country": country,
                            "is_indian": is_indian,
                            "cultural_context": "indian" if is_indian else "global"
                        }
                        
                        logger.info(
                            "timezone_and_context_detected",
                            ip=ip_address,
                            timezone=timezone,
                            country=country_code,
                            is_indian=is_indian,
                            provider="ipinfo"
                        )
                        return result
                        
        except Exception as e:
            logger.error(
                "timezone_detection_failed",
                ip=ip_address,
                error=str(e)
            )
        
        return None
    
    @staticmethod
    def is_indian_context(timezone: str, country_code: str = "", country: str = "") -> bool:
        """
        Determine if user is in Indian context based on timezone and country.
        """
        # Check if timezone is Indian
        if timezone in TimezoneDetectionService.INDIAN_TIMEZONES:
            return True
        
        # Check if country is India
        if country_code.upper() == "IN" or country.lower() in ["india", "bharat"]:
            return True
        
        # Check if timezone starts with Asia and has Indian city
        if timezone and "Asia" in timezone:
            indian_cities = ["kolkata", "calcutta", "delhi", "mumbai", "bangalore", "chennai", "hyderabad", "pune"]
            if any(city in timezone.lower() for city in indian_cities):
                return True
        
        return False
    
    @staticmethod
    def get_indian_festivals() -> Dict[str, list]:
        """Get current year's Indian festivals."""
        from datetime import datetime
        year = datetime.now().year
        
        festivals: Dict[str, list] = {}
        for festival, dates in TimezoneDetectionService.INDIAN_FESTIVALS.items():
            for date_str in dates:
                if str(year) in date_str:
                    festivals[festival] = dates
                    break
        
        return festivals
    
    @classmethod
    async def detect_and_update_user_timezone(
        cls,
        user,
        request_headers: dict,
        forwarded_for: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Detect timezone and cultural context from request and update user if different.
        Returns detected context or user's current timezone.
        """
        # Get client IP
        client_ip = cls.get_client_ip(request_headers, forwarded_for)
        
        # Try to detect timezone and context from IP
        detected_context = await cls.detect_timezone_from_ip(client_ip)
        
        if detected_context:
            detected_tz = detected_context.get("timezone")
            if detected_tz and detected_tz != user.timezone:
                logger.info(
                    "updating_user_timezone_and_context",
                    user_id=str(user.id),
                    old_timezone=user.timezone,
                    new_timezone=detected_tz,
                    is_indian=detected_context.get("is_indian", False),
                    ip=client_ip
                )
                return detected_context
        
        # Return existing timezone if detection failed or matches
        return {
            "timezone": user.timezone if user.timezone else "UTC",
            "is_indian": cls.is_indian_context(user.timezone or "UTC"),
            "cultural_context": "indian" if cls.is_indian_context(user.timezone or "UTC") else "global"
        }
