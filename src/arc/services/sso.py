"""
SSO (Single Sign-On) service for OAuth 2.0 Authorization Code Flow with PKCE.

This service handles OAuth integration with Azure AD, Google, and GitHub providers.
Supports multi-tenant configuration, auto-provisioning, and account linking.

Security Features:
- PKCE (Proof Key for Code Exchange) - RFC 7636
- State parameter for CSRF protection
- Client secret encryption using Fernet (symmetric encryption)
- Constant-time state comparison using secrets.compare_digest()

Usage:
    from arc.services.sso import sso_service

    # Start OAuth flow
    result = await sso_service.start_oauth(
        provider="azure",
        tenant_id="tenant-123",
        return_url="/dashboard"
    )
    # Returns: {"auth_url", "state", "code_verifier", "return_url"}

    # Handle callback
    result = await sso_service.handle_callback(
        provider="azure",
        tenant_id="tenant-123",
        code="auth-code",
        state="returned-state",
        code_verifier="stored-verifier",
        expected_state="stored-state"
    )
    # Returns: {"action": "login|created|link_required", "user": {...}}

Gold Standards:
- Absolute imports only
- DataFlow Express API for performance (NO workflows for simple CRUD)
- NO MOCKING in integration tests (use real database)
- PKCE required for all OAuth flows
- State validation using secrets.compare_digest()
"""

import base64
import hashlib
import os
import secrets
from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

import httpx
from cryptography.fernet import Fernet

from arc.models.database import db


class OAuthConfig:
    """
    OAuth provider endpoint configurations.

    Defines authorization, token, and userinfo endpoints for each provider.
    Azure AD supports multi-tenant with tenant_id="common".
    """

    PROVIDERS = {
        "azure": {
            "authorization_endpoint": "https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize",
            "token_endpoint": "https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token",
            "userinfo_endpoint": "https://graph.microsoft.com/v1.0/me",
            "scopes": ["openid", "profile", "email", "User.Read"],
        },
        "google": {
            "authorization_endpoint": "https://accounts.google.com/o/oauth2/v2/auth",
            "token_endpoint": "https://oauth2.googleapis.com/token",
            "userinfo_endpoint": "https://www.googleapis.com/oauth2/v3/userinfo",
            "scopes": ["openid", "profile", "email"],
        },
        "github": {
            "authorization_endpoint": "https://github.com/login/oauth/authorize",
            "token_endpoint": "https://github.com/login/oauth/access_token",
            "userinfo_endpoint": "https://api.github.com/user",
            "emails_endpoint": "https://api.github.com/user/emails",
            "scopes": ["read:user", "user:email"],
        },
    }


class SSOService:
    """
    Service for OAuth SSO operations.

    Handles OAuth 2.0 Authorization Code Flow with PKCE for Azure AD, Google, and GitHub.
    Supports user provisioning, account linking, and multi-tenant configuration.
    """

    def __init__(self):
        """Initialize SSOService with environment configuration."""
        self.redirect_base = os.environ.get(
            "SSO_REDIRECT_BASE_URL", "http://localhost:3000"
        )
        self.encryption_key = os.environ.get("SSO_SECRET_ENCRYPTION_KEY")

        # Initialize Fernet cipher if encryption key provided
        self.fernet = None
        if self.encryption_key:
            try:
                self.fernet = Fernet(self.encryption_key.encode())
            except Exception:
                # Invalid key format - continue without encryption
                pass

    # =========================================================================
    # OAuth Flow
    # =========================================================================

    async def start_oauth(
        self, provider: str, tenant_id: str, return_url: str | None = None
    ) -> dict[str, str]:
        """
        Generate OAuth authorization URL with PKCE.

        Args:
            provider: OAuth provider ("azure", "google", "github")
            tenant_id: Tenant ID for configuration lookup
            return_url: URL to redirect to after successful OAuth (optional)

        Returns:
            Dictionary with:
            - auth_url: OAuth authorization URL (redirect user here)
            - state: CSRF state parameter (store in session)
            - code_verifier: PKCE code verifier (store in session)
            - return_url: Return URL after OAuth completion

        Raises:
            ValueError: If provider not configured or disabled
        """
        # Get provider config from database
        sso_config = await self._get_sso_config(provider, tenant_id)
        if not sso_config or not sso_config.get("is_enabled", False):
            raise ValueError(f"Provider {provider} not configured or disabled")

        # Generate PKCE values
        code_verifier = secrets.token_urlsafe(32)
        code_challenge = base64.urlsafe_b64encode(
            hashlib.sha256(code_verifier.encode()).digest()
        ).decode().rstrip("=")

        # Generate state for CSRF protection
        state = secrets.token_urlsafe(32)

        # Build authorization URL
        provider_config = OAuthConfig.PROVIDERS[provider]
        auth_endpoint = provider_config["authorization_endpoint"]

        # Azure: substitute tenant ID
        if provider == "azure":
            azure_tenant = sso_config.get("azure_tenant_id", "common")
            auth_endpoint = auth_endpoint.format(tenant=azure_tenant)

        # Build query parameters
        params = {
            "client_id": sso_config["client_id"],
            "redirect_uri": f"{self.redirect_base}/auth/callback",
            "response_type": "code",
            "scope": " ".join(provider_config["scopes"]),
            "state": state,
            "code_challenge": code_challenge,
            "code_challenge_method": "S256",
        }

        # Google: add domain hint if configured
        if provider == "google" and sso_config.get("google_domain"):
            params["hd"] = sso_config["google_domain"]

        # Build URL
        from urllib.parse import urlencode

        auth_url = f"{auth_endpoint}?{urlencode(params)}"

        return {
            "auth_url": auth_url,
            "state": state,
            "code_verifier": code_verifier,
            "return_url": return_url or "/dashboard",
        }

    async def handle_callback(
        self,
        provider: str,
        tenant_id: str,
        code: str,
        state: str,
        code_verifier: str,
        expected_state: str,
    ) -> dict[str, Any]:
        """
        Exchange authorization code for tokens and user info.

        Args:
            provider: OAuth provider
            tenant_id: Tenant ID
            code: Authorization code from OAuth callback
            state: State parameter from OAuth callback
            code_verifier: PKCE code verifier (from session)
            expected_state: Expected state value (from session)

        Returns:
            Dictionary with:
            - action: "login" | "created" | "link_required"
            - user: User dictionary (if login or created)
            - user_id: User ID (if link_required)
            - provider: Provider name (if link_required)
            - provider_user_id: External user ID (if link_required)
            - provider_email: Email from provider (if link_required)
            - provider_name: Name from provider (if link_required)

        Raises:
            ValueError: If state invalid or token exchange fails
        """
        # Validate state using constant-time comparison
        if not secrets.compare_digest(state, expected_state):
            raise ValueError("Invalid state parameter")

        # Get provider config
        sso_config = await self._get_sso_config(provider, tenant_id)
        if not sso_config:
            raise ValueError(f"Provider {provider} not configured")

        provider_config = OAuthConfig.PROVIDERS[provider]

        # Decrypt client secret
        client_secret = self._decrypt_secret(sso_config["client_secret_encrypted"])

        # Exchange code for tokens
        token_endpoint = provider_config["token_endpoint"]
        if provider == "azure":
            azure_tenant = sso_config.get("azure_tenant_id", "common")
            token_endpoint = token_endpoint.format(tenant=azure_tenant)

        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                token_endpoint,
                data={
                    "client_id": sso_config["client_id"],
                    "client_secret": client_secret,
                    "code": code,
                    "redirect_uri": f"{self.redirect_base}/auth/callback",
                    "grant_type": "authorization_code",
                    "code_verifier": code_verifier,
                },
                headers={"Accept": "application/json"},
            )

            if token_response.status_code != 200:
                raise ValueError(f"Token exchange failed: {token_response.text}")

            tokens = token_response.json()

            # Get user info
            user_info = await self._get_user_info(
                provider, tokens["access_token"], provider_config
            )

        # Handle user creation/linking
        return await self._handle_user(provider, tenant_id, user_info, sso_config)

    # =========================================================================
    # User Handling
    # =========================================================================

    async def _handle_user(
        self,
        provider: str,
        tenant_id: str,
        user_info: dict[str, Any],
        sso_config: dict[str, Any],
    ) -> dict[str, Any]:
        """
        Handle user creation or linking based on SSO callback.

        Logic:
        1. Check for existing linked account → login
        2. Check for existing user by email → link_required
        3. Auto-provision new user (if enabled)

        Args:
            provider: OAuth provider
            tenant_id: Tenant ID
            user_info: User info from OAuth provider
            sso_config: SSO provider configuration

        Returns:
            Dictionary with action and user/link data

        Raises:
            ValueError: If auto-provisioning disabled
        """
        # Extract user info
        provider_user_id = user_info.get("sub") or user_info.get("id")
        email = user_info.get("email")
        name = user_info.get("name") or email

        # 1. Check for existing linked account
        linked_accounts = await db.express.list(
            "LinkedAccount",
            filter={
                "provider_type": provider,
                "provider_user_id": str(provider_user_id),
            },
        )

        if linked_accounts:
            linked = linked_accounts[0]
            # Update last login timestamp
            await db.express.update(
                "LinkedAccount",
                linked["id"],
                {"last_login_at": datetime.now(UTC).isoformat()},
            )
            user = await db.express.read("User", linked["user_id"])
            return {"action": "login", "user": user}

        # 2. Check for existing user by email
        if email:
            existing_users = await db.express.list(
                "User",
                filter={
                    "email": email,
                    "tenant_id": tenant_id,
                },
            )

            if existing_users:
                # User exists but not linked - prompt to link
                return {
                    "action": "link_required",
                    "user_id": existing_users[0]["id"],
                    "provider": provider,
                    "provider_user_id": str(provider_user_id),
                    "provider_email": email,
                    "provider_name": name,
                }

        # 3. Auto-provision new user
        if not sso_config.get("auto_provision", True):
            raise ValueError("User provisioning disabled for this tenant")

        new_user = await db.express.create(
            "User",
            {
                "id": str(uuid4()),
                "tenant_id": tenant_id,
                "email": email,
                "name": name,
                "auth_provider": provider,
                "auth_provider_id": str(provider_user_id),
                "role": sso_config.get("default_role", "viewer"),
                "is_active": True,
            },
        )

        # Create linked account
        await db.express.create(
            "LinkedAccount",
            {
                "id": str(uuid4()),
                "user_id": new_user["id"],
                "provider_type": provider,
                "provider_user_id": str(provider_user_id),
                "provider_email": email,
                "provider_name": name,
                "linked_at": datetime.now(UTC).isoformat(),
            },
        )

        return {"action": "created", "user": new_user}

    async def link_account(
        self,
        user_id: str,
        provider: str,
        provider_user_id: str,
        provider_email: str,
        provider_name: str | None = None,
    ) -> dict[str, Any]:
        """
        Link an existing user account to an SSO provider.

        Args:
            user_id: User ID to link
            provider: OAuth provider
            provider_user_id: External user ID from provider
            provider_email: Email from provider
            provider_name: Display name from provider (optional)

        Returns:
            LinkedAccount record

        Raises:
            ValueError: If account already linked to this provider
        """
        # Check if already linked
        existing = await db.express.list(
            "LinkedAccount",
            filter={
                "user_id": user_id,
                "provider_type": provider,
            },
        )

        if existing:
            raise ValueError(f"Account already linked to {provider}")

        linked = await db.express.create(
            "LinkedAccount",
            {
                "id": str(uuid4()),
                "user_id": user_id,
                "provider_type": provider,
                "provider_user_id": provider_user_id,
                "provider_email": provider_email,
                "provider_name": provider_name,
                "linked_at": datetime.now(UTC).isoformat(),
            },
        )

        return linked

    async def unlink_account(self, user_id: str, provider: str) -> bool:
        """
        Unlink an SSO provider from a user account.

        Args:
            user_id: User ID
            provider: OAuth provider to unlink

        Returns:
            True if unlinked successfully

        Raises:
            ValueError: If trying to unlink last authentication method
        """
        linked = await db.express.list(
            "LinkedAccount",
            filter={
                "user_id": user_id,
                "provider_type": provider,
            },
        )

        if not linked:
            return False

        # Verify user has other auth methods
        user = await db.express.read("User", user_id)
        other_links = await db.express.list(
            "LinkedAccount",
            filter={"user_id": user_id},
        )

        # User must have either password or other linked accounts
        if len(other_links) <= 1 and not user.get("password_hash"):
            raise ValueError("Cannot unlink last authentication method")

        await db.express.delete("LinkedAccount", linked[0]["id"])
        return True

    # =========================================================================
    # Helper Methods
    # =========================================================================

    async def _get_sso_config(
        self, provider: str, tenant_id: str
    ) -> dict[str, Any] | None:
        """
        Get SSO configuration for provider and tenant.

        Args:
            provider: OAuth provider
            tenant_id: Tenant ID

        Returns:
            SSO provider configuration or None if not found
        """
        configs = await db.express.list(
            "SSOProvider",
            filter={
                "tenant_id": tenant_id,
                "provider_type": provider,
            },
        )
        return configs[0] if configs else None

    async def _get_user_info(
        self,
        provider: str,
        access_token: str,
        provider_config: dict[str, Any],
    ) -> dict[str, Any]:
        """
        Fetch user info from OAuth provider.

        Args:
            provider: OAuth provider
            access_token: OAuth access token
            provider_config: Provider configuration

        Returns:
            User info dictionary with at minimum: sub/id, email, name
        """
        async with httpx.AsyncClient() as client:
            headers = {"Authorization": f"Bearer {access_token}"}

            # GitHub uses different auth header
            if provider == "github":
                headers = {
                    "Authorization": f"token {access_token}",
                    "Accept": "application/vnd.github.v3+json",
                }

            response = await client.get(
                provider_config["userinfo_endpoint"],
                headers=headers,
            )
            user_info = response.json()

            # GitHub: fetch email separately if not in profile
            if provider == "github" and not user_info.get("email"):
                emails_response = await client.get(
                    provider_config["emails_endpoint"],
                    headers=headers,
                )
                emails = emails_response.json()
                # Find primary verified email
                primary = next(
                    (e for e in emails if e.get("primary") and e.get("verified")),
                    None,
                )
                if primary:
                    user_info["email"] = primary["email"]

            return user_info

    def _decrypt_secret(self, encrypted: str) -> str:
        """
        Decrypt client secret.

        Args:
            encrypted: Encrypted secret

        Returns:
            Decrypted secret
        """
        if self.fernet:
            return self.fernet.decrypt(encrypted.encode()).decode()
        return encrypted

    def _encrypt_secret(self, secret: str) -> str:
        """
        Encrypt client secret for storage.

        Args:
            secret: Plaintext secret

        Returns:
            Encrypted secret
        """
        if self.fernet:
            return self.fernet.encrypt(secret.encode()).decode()
        return secret


# Singleton instance
sso_service = SSOService()
