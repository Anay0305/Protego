"""
Protego Backend - FastAPI Application
Main entry point for the AI-Powered Personal Safety Companion API.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from config import settings
from database import init_db
from routers import users, walk, alerts, admin, auth


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for FastAPI application.
    Handles startup and shutdown events.
    """
    # Startup: Initialize database
    print("🚀 Starting Protego Backend...")
    print(f"📊 Environment: {settings.environment}")
    print(f"🧪 Test Mode: {settings.test_mode}")
    init_db()
    print("✅ Database initialized")

    yield

    # Shutdown
    print("👋 Shutting down Protego Backend...")


# Initialize FastAPI application
app = FastAPI(
    title="Protego API",
    description="AI-Powered Personal Safety Companion - Backend API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/users", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(walk.router, prefix="/api/walk", tags=["Walk Sessions"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["Alerts"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])


@app.get("/", tags=["Health"])
async def root():
    """Root endpoint - Health check."""
    return {
        "service": "Protego API",
        "status": "healthy",
        "version": "1.0.0",
        "environment": settings.environment
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Detailed health check endpoint."""
    return {
        "status": "healthy",
        "database": "connected",
        "test_mode": settings.test_mode
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True if not settings.is_production else False
    )
