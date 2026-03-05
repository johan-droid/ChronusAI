"""
FastAPI application factory and main entry point.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

from app.config import get_settings
from app.db.redis import close_redis
from app.api.v1 import auth, chat, meetings, users


settings = get_settings()

# Rate limiter setup
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for startup/shutdown events."""
    # Startup
    print(f"🚀 Starting Meeting Scheduler Agent in {settings.APP_ENV} mode")
    
    yield
    
    # Shutdown
    print("👋 Shutting down...")
    await close_redis()


# Create FastAPI app
app = FastAPI(
    title="Meeting Scheduler Agent",
    description="AI-powered meeting scheduling assistant with natural language interface",
    version="1.0.0",
    lifespan=lifespan,
)

# Add rate limiter
app.state.limiter = limiter
app.add_exception_handler(429, _rate_limit_exceeded_handler)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include API routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1")
app.include_router(meetings.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")


@app.get("/")
async def root():
    """Root endpoint - health check."""
    return {
        "name": "Meeting Scheduler Agent",
        "version": "1.0.0",
        "status": "running",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint for load balancers."""
    return {"status": "healthy"}
