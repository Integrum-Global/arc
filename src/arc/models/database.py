"""
DataFlow database initialization for ARC platform.

CRITICAL: Uses auto_migrate=False for Docker/FastAPI compatibility.
Tables are created explicitly via create_tables_async() in the FastAPI lifespan handler.
"""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Any

from dataflow import DataFlow

from arc.core.config import settings


def _get_database_url() -> str:
    """Get database URL from settings."""
    return settings.database.connection_url


# Initialize DataFlow with Docker-safe settings
db = DataFlow(
    database_url=_get_database_url(),
    auto_migrate=False,  # CRITICAL: Prevents sync table creation at import time
)


async def create_tables() -> None:
    """
    Create all database tables.

    Call this in FastAPI lifespan or test setup.
    Must be called in an async context after models are registered.
    """
    await db.create_tables_async()


async def close_database() -> None:
    """
    Close database connections.

    Call this in FastAPI lifespan teardown.
    """
    await db.close_async()


@asynccontextmanager
async def database_lifespan(app: Any) -> AsyncGenerator[None, None]:
    """
    FastAPI lifespan context manager for database initialization.

    Usage:
        from fastapi import FastAPI
        from arc.models.database import database_lifespan

        app = FastAPI(lifespan=database_lifespan)
    """
    # Startup: Create tables
    await create_tables()
    yield
    # Shutdown: Close connections
    await close_database()


# Export the DataFlow instance for use by models
__all__ = [
    "db",
    "create_tables",
    "close_database",
    "database_lifespan",
]
