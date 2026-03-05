"""
API router module for v1 endpoints.
"""
from fastapi import APIRouter

# Import all routers
from app.api.v1 import auth, chat, meetings, users

# Create main router (not used directly, individual routers are included in main.py)
router = APIRouter(prefix="/api/v1")

__all__ = ["auth", "chat", "meetings", "users"]
