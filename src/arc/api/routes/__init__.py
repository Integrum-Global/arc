"""
Custom API routes for ARC.

This package provides custom endpoint implementations beyond
auto-generated CRUD operations:
- Authentication endpoints
- Portfolio endpoints
- Analytics endpoints
- User management endpoints
- Admin endpoints
- Webhook handlers (TODO)

Usage:
    from arc.api.routes import auth, portfolios, analytics

    # Routes are registered in app.py
"""

from arc.api.routes import admin, analytics, auth, portfolios, users

__all__ = ["admin", "analytics", "auth", "portfolios", "users"]
