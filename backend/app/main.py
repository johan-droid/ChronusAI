from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import structlog
import time
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.config import settings
from app.api.v1.router import api_router
from app.db.redis import redis_client
from app.core.rate_limit import limiter
from app.core.middleware import TokenRefreshMiddleware

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
    logger.info("Starting up Meeting Scheduler API")
    await redis_client.connect()
    yield
    # Shutdown
    logger.info("Shutting down Meeting Scheduler API")
    await redis_client.disconnect()


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
app.add_middleware(TokenRefreshMiddleware)

# CORS middleware - Enhanced for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        str(settings.frontend_url),
        "https://chronus-ai.vercel.app",
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
        duration_ms=round((time.perf_counter() - start) * 1000, 2),
    )
    
    return response


# Include API routes
app.include_router(api_router)


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
        "uptime": "operational"
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
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.app_env == "development"
    )
