from fastapi import APIRouter
from app.api.v1 import auth, availability, calendar, chat, meetings, users, greetings

api_router = APIRouter(
    prefix="/api/v1",
    responses={
        200: {"description": "Successful response"},
        400: {"description": "Bad request"},
        401: {"description": "Unauthorized"},
        403: {"description": "Forbidden"},
        404: {"description": "Not found"},
        429: {"description": "Rate limit exceeded"},
        500: {"description": "Internal server error"}
    }
)

api_router.include_router(auth.router, prefix="/auth")
api_router.include_router(auth.microsoft_router)
api_router.include_router(availability.router)
api_router.include_router(calendar.router)
api_router.include_router(chat.router)
api_router.include_router(meetings.router)
api_router.include_router(users.router)
api_router.include_router(greetings.router)
