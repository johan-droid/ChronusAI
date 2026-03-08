import httpx
from typing import Any, Dict, List, Optional
from datetime import datetime
from app.config import settings
import structlog

logger = structlog.get_logger()

class ZoomClient:
    def __init__(self, access_token: str):
        self.access_token = access_token
        self.base_url = "https://api.zoom.us/v2"
        self.headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }

    async def create_meeting(
        self, 
        topic: str, 
        start_time: datetime, 
        duration_minutes: int,
        description: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a Zoom meeting."""
        url = f"{self.base_url}/users/me/meetings"
        data = {
            "topic": topic,
            "type": 2, # Scheduled meeting
            "start_time": start_time.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "duration": duration_minutes,
            "agenda": description or "",
            "settings": {
                "host_video": True,
                "participant_video": True,
                "join_before_host": False,
                "mute_upon_entry": True,
                "waiting_room": True
            }
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=self.headers, json=data)
            if response.status_code != 201:
                logger.error("zoom_meeting_creation_failed", status=response.status_code, text=response.text)
                raise Exception(f"Failed to create Zoom meeting: {response.text}")
            
            return response.json()
        raise Exception("Unreachable")

    async def get_meeting(self, meeting_id: str) -> Dict[str, Any]:
        """Get Zoom meeting details."""
        url = f"{self.base_url}/meetings/{meeting_id}"
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=self.headers)
            if response.status_code != 200:
                raise Exception(f"Failed to get Zoom meeting: {response.text}")
            return response.json()
        raise Exception("Unreachable")

    async def update_meeting(
        self,
        meeting_id: str,
        *,
        topic: Optional[str] = None,
        start_time: Optional[datetime] = None,
        duration_minutes: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Update a Zoom meeting (policy: PATCH /meetings/{id})."""
        url = f"{self.base_url}/meetings/{meeting_id}"
        payload: Dict[str, Any] = {}
        if topic is not None:
            payload["topic"] = topic
        if start_time is not None:
            payload["start_time"] = start_time.strftime("%Y-%m-%dT%H:%M:%SZ")
        if duration_minutes is not None:
            payload["duration"] = duration_minutes
        if not payload:
            return await self.get_meeting(meeting_id)
        async with httpx.AsyncClient() as client:
            response = await client.patch(url, headers=self.headers, json=payload)
            if response.status_code != 204:
                logger.error("zoom_meeting_update_failed", status=response.status_code, text=response.text)
                raise Exception(f"Failed to update Zoom meeting: {response.text}")
            return await self.get_meeting(meeting_id)
        raise Exception("Unreachable")

    async def delete_meeting(self, meeting_id: str) -> bool:
        """Delete a Zoom meeting."""
        url = f"{self.base_url}/meetings/{meeting_id}"
        async with httpx.AsyncClient() as client:
            response = await client.delete(url, headers=self.headers)
            return response.status_code == 204
        raise Exception("Unreachable")

class ZoomOAuth:
    def __init__(self):
        self.client_id = settings.zoom_client_id
        self.client_secret = settings.zoom_client_secret
        self.redirect_uri = str(settings.zoom_redirect_uri)
        self.auth_url = "https://zoom.us/oauth/authorize"
        self.token_url = "https://zoom.us/oauth/token"

    def get_authorization_url(self, state: str) -> str:
        """Get the Zoom authorization URL."""
        params = {
            "response_type": "code",
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "state": state
        }
        from urllib.parse import urlencode
        return f"{self.auth_url}?{urlencode(params)}"

    async def exchange_code_for_tokens(self, code: str) -> Dict[str, Any]:
        """Exchange authorization code for Zoom tokens."""
        import base64
        auth_header = base64.b64encode(f"{self.client_id}:{self.client_secret}".encode()).decode()
        
        headers = {
            "Authorization": f"Basic {auth_header}",
            "Content-Type": "application/x-www-form-urlencoded"
        }
        data = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": self.redirect_uri
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(self.token_url, headers=headers, data=data)
            if response.status_code != 200:
                raise Exception(f"Zoom token exchange failed: {response.text}")
            return response.json()
        raise Exception("Unreachable")

    async def refresh_token(self, refresh_token: str) -> Dict[str, Any]:
        """Refresh Zoom access token."""
        import base64
        auth_header = base64.b64encode(f"{self.client_id}:{self.client_secret}".encode()).decode()
        
        headers = {
            "Authorization": f"Basic {auth_header}",
            "Content-Type": "application/x-www-form-urlencoded"
        }
        data = {
            "grant_type": "refresh_token",
            "refresh_token": refresh_token
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(self.token_url, headers=headers, data=data)
            if response.status_code != 200:
                raise Exception(f"Zoom token refresh failed: {response.text}")
            return response.json()
        raise Exception("Unreachable")
