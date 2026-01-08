"""
Middleware for ARC API.

This package provides request/response middleware:
- Tenant context extraction and injection
- Audit logging for compliance
- Request timing and metrics
- Error handling standardization

Usage:
    from arc.api.middleware import TenantMiddleware, AuditMiddleware

    app.add_middleware(TenantMiddleware)
    app.add_middleware(AuditMiddleware)
"""

# Middleware components will be exported as they are implemented
__all__: list[str] = []
