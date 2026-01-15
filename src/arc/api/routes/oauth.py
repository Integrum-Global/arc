"""
OAuth API routes for ARC Enterprise SSO.

Implements OAuth 2.0 authorization code flow with PKCE support for:
- Azure AD (multi-tenant)
- Google Workspace
- GitHub

Endpoints:
- POST /api/v1/auth/oauth/{provider} - Start OAuth flow
- POST /api/v1/auth/oauth/{provider}/callback - Handle OAuth callback

Architecture:
- Direct async functions (not workflows) for OAuth operations
- Calls SSO service for OAuth logic
- Returns auth URLs, JWT tokens, and user data
- Supports account linking for existing users

Security:
- PKCE (Proof Key for Code Exchange) enforced
- State parameter for CSRF protection
- Token validation via SSO service
- JWT tokens for session management
"""

from typing import Any
from pydantic import BaseModel, Field


# =============================================================================
# REQUEST/RESPONSE SCHEMAS
# =============================================================================


class OAuthStartRequest(BaseModel):
    """Request to start OAuth flow."""

    tenant_id: str = Field(..., description="Tenant ID for SSO configuration")
    return_url: str | None = Field(None, description="URL to redirect after login")


class OAuthStartResponse(BaseModel):
    """Response with OAuth authorization URL."""

    auth_url: str = Field(..., description="URL to redirect user for authentication")
    state: str = Field(..., description="CSRF protection state parameter")
    code_verifier: str = Field(..., description="PKCE code verifier for callback")


class OAuthCallbackRequest(BaseModel):
    """Request to handle OAuth callback."""

    tenant_id: str = Field(..., description="Tenant ID for SSO configuration")
    code: str = Field(..., description="Authorization code from provider")
    state: str = Field(..., description="State parameter for validation")
    code_verifier: str = Field(..., description="PKCE code verifier")


class OAuthCallbackSuccessResponse(BaseModel):
    """Response for successful OAuth callback."""

    action: str = Field(..., description="Action taken: login, created")
    access_token: str = Field(..., description="JWT access token")
    refresh_token: str = Field(..., description="Refresh token")
    token_type: str = Field(default="Bearer", description="Token type")
    expires_in: int = Field(default=900, description="Access token expiry in seconds")
    user: dict = Field(..., description="User profile data")


class OAuthCallbackLinkRequiredResponse(BaseModel):
    """Response when account linking is required."""

    action: str = Field(default="link_required", description="Action: link_required")
    link_data: dict = Field(..., description="Data for account linking")


# =============================================================================
# OAUTH ROUTE FUNCTIONS
# =============================================================================


async def start_oauth(provider: str, tenant_id: str, return_url: str | None = None) -> dict[str, Any]:
    """
    Start OAuth 2.0 authorization flow.

    Args:
        provider: OAuth provider (azure, google, github)
        tenant_id: Tenant ID for SSO configuration lookup
        return_url: Optional URL to redirect after login

    Returns:
        dict with auth_url, state, code_verifier

    Raises:
        ValueError: If provider not configured or disabled
    """
    from arc.services.sso import sso_service

    # Call SSO service to generate OAuth URL
    result = await sso_service.start_oauth(
        provider=provider,
        tenant_id=tenant_id,
        return_url=return_url,
    )

    return {
        "auth_url": result["auth_url"],
        "state": result["state"],
        "code_verifier": result["code_verifier"],  # Client must store this!
    }


async def handle_oauth_callback(
    provider: str,
    tenant_id: str,
    code: str,
    state: str,
    code_verifier: str,
) -> dict[str, Any]:
    """
    Handle OAuth 2.0 authorization callback.

    Args:
        provider: OAuth provider (azure, google, github)
        tenant_id: Tenant ID for SSO configuration
        code: Authorization code from provider
        state: State parameter from callback
        code_verifier: PKCE code verifier from start

    Returns:
        dict with action, tokens, and user data OR link_required

    Raises:
        ValueError: If state invalid or token exchange fails
    """
    from arc.services.sso import sso_service
    from arc.api.auth import create_access_token, create_refresh_token, get_role_permissions

    # Call SSO service to handle OAuth callback
    result = await sso_service.handle_callback(
        provider=provider,
        tenant_id=tenant_id,
        code=code,
        state=state,
        code_verifier=code_verifier,
        expected_state=state,  # For CSRF validation
    )

    # Check if account linking is required
    if result["action"] == "link_required":
        return {
            "action": "link_required",
            "link_data": {
                "user_id": result["user_id"],
                "provider": result["provider"],
                "provider_user_id": result["provider_user_id"],
                "provider_email": result["provider_email"],
                "provider_name": result.get("provider_name"),
            },
        }

    # User was created or logged in - generate JWT tokens
    user = result["user"]
    role = user.get("role", "viewer")
    permissions = [p.value for p in get_role_permissions(role)]

    # Create access token (15 minutes)
    access_token = create_access_token(
        user_id=user["id"],
        tenant_id=user["tenant_id"],
        role=role,
        permissions=permissions,
    )

    # Create refresh token (7 days)
    refresh_token = create_refresh_token(
        user_id=user["id"],
        tenant_id=user["tenant_id"],
    )

    return {
        "action": result["action"],  # "created" or "login"
        "access_token": access_token,
        "refresh_token": refresh_token,
        "expires_in": 900,  # 15 minutes in seconds
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "role": role,
            "tenant_id": user["tenant_id"],
        },
    }


# =============================================================================
# EXPORTS
# =============================================================================

__all__ = [
    # Schemas
    "OAuthStartRequest",
    "OAuthStartResponse",
    "OAuthCallbackRequest",
    "OAuthCallbackSuccessResponse",
    "OAuthCallbackLinkRequiredResponse",
    # Functions
    "start_oauth",
    "handle_oauth_callback",
]
