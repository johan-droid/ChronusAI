from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from contextlib import asynccontextmanager
import structlog
import time
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.config import settings
from app.api.v1.router import api_router
from app.core.rate_limit import limiter
from app.core.middleware import TokenRefreshMiddleware, SecurityValidationMiddleware
from app.core.self_ping import SelfPinger

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()


async def rate_limit_exceeded_handler(request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=429,
        content={"detail": "Rate limit exceeded"},
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting up ChronosAI API")
    
    # Create database tables
    from app.db.session import engine, Base
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created")
    
    # Start aggressive self-ping for Render free tier (always run to prevent sleep)
    import os
    render_url = os.getenv("RENDER_EXTERNAL_URL") or os.getenv("BACKEND_URL") or "https://chronusai.onrender.com"
    self_pinger = SelfPinger(url=render_url, interval=30)  # Aggressive 30-second pings
    self_pinger.start()
    logger.info("Aggressive self-ping service started", url=render_url)
    
    yield
    
    # Shutdown
    logger.info("Shutting down ChronosAI API")
    self_pinger.stop()


app = FastAPI(
    title="ChronosAI - Meeting Scheduler API",
    description="🚀 AI-powered meeting scheduling agent with natural language processing",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)
app.add_middleware(SecurityValidationMiddleware)  # Add security validation first
app.add_middleware(TokenRefreshMiddleware)

# CORS middleware - Enhanced for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        str(settings.frontend_url),
        "https://chronos-ai-theta.vercel.app",
        "http://localhost:5173",
        "http://localhost:3000",
        *settings.cors_origins
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=[
        "Content-Type",
        "Authorization",
        "Accept",
        "Origin",
        "User-Agent",
        "DNT",
        "Cache-Control",
        "X-Requested-With"
    ],
    expose_headers=["Content-Length", "X-Request-ID"],
    max_age=3600,
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests with structured data."""
    start = time.perf_counter()
    response = await call_next(request)

    logger.info(
        "HTTP request processed",
        method=request.method,
        url=str(request.url),
        status_code=response.status_code,
        duration_ms=int((time.perf_counter() - start) * 1000),
    )
    
    return response


# Include API routes
app.include_router(api_router)

# API routes are included via api_router which already includes auth.router at /api/v1/auth


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "service": "ChronosAI",
        "description": "AI-Powered Meeting Scheduler",
        "version": "1.0.0",
        "status": "operational",
        "docs": "/api/docs",
        "features": [
            "Natural Language Processing",
            "Multi-Calendar Integration",
            "Smart Conflict Resolution",
            "Real-time Sync"
        ]
    }


@app.get("/health")
async def health_check():
    """Health check endpoint with detailed status."""
    return {
        "status": "healthy",
        "service": "ChronosAI",
        "version": "1.0.0",
        "uptime": "operational",
        "timestamp": time.time()
    }


@app.get("/api/v1/status")
async def api_status():
    """API status for frontend health indicator."""
    return {
        "online": True,
        "latency": "low",
        "timestamp": time.time(),
        "oauth_configured": {
            "google": bool(settings.google_client_id and settings.google_client_secret),
            "microsoft": bool(settings.microsoft_client_id and settings.microsoft_client_secret)
        }
    }


# Exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler."""
    logger.error(
        "Unhandled exception",
        exc_info=exc,
        url=str(request.url),
        method=request.method
    )
    
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.app_env == "development"
    )
