"""
Nexus API gateway for ARC.

This package contains the API layer built using Kailash Nexus.
Nexus provides a unified multi-channel platform supporting REST API,
CLI, and MCP interfaces from the same workflow definitions.

Submodules:
    - app: Main Nexus application setup
    - auth: Authentication and authorization (TODO)
    - endpoints: API endpoint definitions (TODO)
    - middleware: Request/response middleware (TODO)

Usage:
    # Run the API server
    uvicorn arc.api.app:app --host 0.0.0.0 --port 8000

    # Or programmatically
    from arc.api import app
    app.run()
"""

from arc.api.app import (
    ALL_MODELS,
    app,
    db,
    initialize_database,
    nexus,
    shutdown_database,
)

__all__ = ["app", "nexus", "db", "ALL_MODELS", "initialize_database", "shutdown_database"]
