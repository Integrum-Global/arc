# ARC Enterprise SSO Implementation Guide

## Overview

This document provides step-by-step implementation instructions for the OAuth 2.0 SSO system. Follow the phases in order for a complete implementation.

---

## Phase 1: Backend Implementation

### 1.1 DataFlow Models

```python
# src/arc/models/sso.py

from dataflow import DataFlow
from typing import Optional
from datetime import datetime
import os

db = DataFlow(os.environ["DATABASE_URL"], auto_migrate=False)

@db.model
class SSOProvider:
    """OAuth provider configuration per tenant."""
    id: str
    tenant_id: str
    provider_type: str  # "azure", "google", "github"
    display_name: str
    client_id: str
    client_secret_encrypted: str

    # Provider-specific
    azure_tenant_id: Optional[str]
    google_domain: Optional[str]

    # Settings
    is_enabled: bool = True
    auto_provision: bool = True
    default_role: str = "viewer"

    created_at: Optional[str]
    updated_at: Optional[str]

    __dataflow__ = {
        "indexes": [
            {"fields": ["tenant_id", "provider_type"], "unique": True}
        ]
    }


@db.model
class LinkedAccount:
    """Links ARC user to external OAuth identity."""
    id: str
    user_id: str
    provider_type: str
    provider_user_id: str
    provider_email: str
    provider_name: Optional[str]
    linked_at: str
    last_login_at: Optional[str]

    __dataflow__ = {
        "indexes": [
            {"fields": ["user_id", "provider_type"], "unique": True},
            {"fields": ["provider_type", "provider_user_id"], "unique": True}
        ]
    }
```

### 1.2 OAuth Service

```python
# src/arc/services/sso.py

import os
import secrets
import hashlib
import base64
from typing import Optional, Dict, Any
from urllib.parse import urlencode
from datetime import datetime, timedelta
from uuid import uuid4
import httpx
from cryptography.fernet import Fernet

from arc.models.sso import db, SSOProvider, LinkedAccount
from arc.models.user import User


class OAuthConfig:
    """OAuth provider configurations."""

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
    """Service for OAuth SSO operations."""

    def __init__(self):
        self.redirect_base = os.environ.get("SSO_REDIRECT_BASE_URL", "http://localhost:3000")
        self.encryption_key = os.environ.get("SSO_SECRET_ENCRYPTION_KEY")
        if self.encryption_key:
            self.fernet = Fernet(self.encryption_key.encode())

    # ─────────────────────────────────────────────────────────────────────
    # OAuth Flow
    # ─────────────────────────────────────────────────────────────────────

    async def start_oauth(
        self,
        provider: str,
        tenant_id: str,
        return_url: Optional[str] = None
    ) -> Dict[str, str]:
        """Generate OAuth authorization URL with PKCE."""

        # Get provider config
        sso_config = await self._get_sso_config(provider, tenant_id)
        if not sso_config or not sso_config["is_enabled"]:
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

        # Azure: substitute tenant
        if provider == "azure":
            azure_tenant = sso_config.get("azure_tenant_id", "common")
            auth_endpoint = auth_endpoint.format(tenant=azure_tenant)

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
    ) -> Dict[str, Any]:
        """Exchange authorization code for tokens and user info."""

        # Validate state
        if not secrets.compare_digest(state, expected_state):
            raise ValueError("Invalid state parameter")

        # Get provider config
        sso_config = await self._get_sso_config(provider, tenant_id)
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

    # ─────────────────────────────────────────────────────────────────────
    # User Handling
    # ─────────────────────────────────────────────────────────────────────

    async def _handle_user(
        self,
        provider: str,
        tenant_id: str,
        user_info: Dict[str, Any],
        sso_config: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Handle user creation or linking based on SSO callback."""

        provider_user_id = user_info.get("sub") or user_info.get("id")
        email = user_info.get("email")
        name = user_info.get("name") or email

        # 1. Check for existing linked account
        linked_accounts = await db.express.list("LinkedAccount", filter={
            "provider_type": provider,
            "provider_user_id": str(provider_user_id),
        })

        if linked_accounts:
            linked = linked_accounts[0]
            # Update last login
            await db.express.update("LinkedAccount", linked["id"], {
                "last_login_at": datetime.utcnow().isoformat()
            })
            user = await db.express.read("User", linked["user_id"])
            return {"action": "login", "user": user}

        # 2. Check for existing user by email
        if email:
            existing_users = await db.express.list("User", filter={
                "email": email,
                "tenant_id": tenant_id,
            })

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

        new_user = await db.express.create("User", {
            "id": str(uuid4()),
            "email": email,
            "name": name,
            "auth_provider": provider,
            "auth_provider_id": str(provider_user_id),
            "role": sso_config.get("default_role", "viewer"),
            "tenant_id": tenant_id,
            "is_active": True,
        })

        # Create linked account
        await db.express.create("LinkedAccount", {
            "id": str(uuid4()),
            "user_id": new_user["id"],
            "provider_type": provider,
            "provider_user_id": str(provider_user_id),
            "provider_email": email,
            "provider_name": name,
            "linked_at": datetime.utcnow().isoformat(),
        })

        return {"action": "created", "user": new_user}

    async def link_account(
        self,
        user_id: str,
        provider: str,
        provider_user_id: str,
        provider_email: str,
        provider_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Link an existing user account to an SSO provider."""

        # Check if already linked
        existing = await db.express.list("LinkedAccount", filter={
            "user_id": user_id,
            "provider_type": provider,
        })

        if existing:
            raise ValueError(f"Account already linked to {provider}")

        linked = await db.express.create("LinkedAccount", {
            "id": str(uuid4()),
            "user_id": user_id,
            "provider_type": provider,
            "provider_user_id": provider_user_id,
            "provider_email": provider_email,
            "provider_name": provider_name,
            "linked_at": datetime.utcnow().isoformat(),
        })

        return linked

    async def unlink_account(self, user_id: str, provider: str) -> bool:
        """Unlink an SSO provider from a user account."""

        linked = await db.express.list("LinkedAccount", filter={
            "user_id": user_id,
            "provider_type": provider,
        })

        if not linked:
            return False

        # Verify user has other auth methods
        user = await db.express.read("User", user_id)
        other_links = await db.express.list("LinkedAccount", filter={
            "user_id": user_id,
        })

        if len(other_links) <= 1 and not user.get("password_hash"):
            raise ValueError("Cannot unlink last authentication method")

        await db.express.delete("LinkedAccount", linked[0]["id"])
        return True

    # ─────────────────────────────────────────────────────────────────────
    # Helper Methods
    # ─────────────────────────────────────────────────────────────────────

    async def _get_sso_config(self, provider: str, tenant_id: str) -> Optional[Dict]:
        """Get SSO configuration for provider and tenant."""
        configs = await db.express.list("SSOProvider", filter={
            "tenant_id": tenant_id,
            "provider_type": provider,
        })
        return configs[0] if configs else None

    async def _get_user_info(
        self,
        provider: str,
        access_token: str,
        provider_config: Dict,
    ) -> Dict[str, Any]:
        """Fetch user info from provider."""

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
                primary = next(
                    (e for e in emails if e.get("primary") and e.get("verified")),
                    None
                )
                if primary:
                    user_info["email"] = primary["email"]

            return user_info

    def _decrypt_secret(self, encrypted: str) -> str:
        """Decrypt client secret."""
        if self.fernet:
            return self.fernet.decrypt(encrypted.encode()).decode()
        return encrypted

    def _encrypt_secret(self, secret: str) -> str:
        """Encrypt client secret for storage."""
        if self.fernet:
            return self.fernet.encrypt(secret.encode()).decode()
        return secret


# Singleton instance
sso_service = SSOService()
```

### 1.3 OAuth API Routes (Nexus)

```python
# src/arc/api/routes/oauth.py

from nexus import Nexus
from kailash.workflow.builder import WorkflowBuilder
from typing import Optional
from fastapi import HTTPException, Response, Request
from pydantic import BaseModel

from arc.services.sso import sso_service
from arc.services.auth import create_jwt_token, create_refresh_token


# Request/Response schemas
class OAuthStartRequest(BaseModel):
    return_url: Optional[str] = None


class OAuthStartResponse(BaseModel):
    auth_url: str
    state: str


class OAuthCallbackRequest(BaseModel):
    code: str
    state: str
    code_verifier: str


class OAuthCallbackResponse(BaseModel):
    access_token: str
    token_type: str = "Bearer"
    expires_in: int
    user: dict


# ─────────────────────────────────────────────────────────────────────────
# Workflow: Start OAuth
# ─────────────────────────────────────────────────────────────────────────

def create_oauth_start_workflow():
    """Workflow to initiate OAuth flow."""
    workflow = WorkflowBuilder(
        name="oauth_start",
        description="Start OAuth authorization flow"
    )

    workflow.add_node("PythonCode", "start_oauth", {
        "code": """
async def run(provider: str, tenant_id: str, return_url: str = None):
    from arc.services.sso import sso_service

    result = await sso_service.start_oauth(
        provider=provider,
        tenant_id=tenant_id,
        return_url=return_url
    )

    return {
        "auth_url": result["auth_url"],
        "state": result["state"],
        "code_verifier": result["code_verifier"],
        "return_url": result["return_url"]
    }
"""
    })

    return workflow


# ─────────────────────────────────────────────────────────────────────────
# Workflow: OAuth Callback
# ─────────────────────────────────────────────────────────────────────────

def create_oauth_callback_workflow():
    """Workflow to handle OAuth callback."""
    workflow = WorkflowBuilder(
        name="oauth_callback",
        description="Handle OAuth authorization callback"
    )

    workflow.add_node("PythonCode", "handle_callback", {
        "code": """
async def run(
    provider: str,
    tenant_id: str,
    code: str,
    state: str,
    code_verifier: str,
    expected_state: str
):
    from arc.services.sso import sso_service
    from arc.services.auth import create_jwt_token, create_refresh_token

    result = await sso_service.handle_callback(
        provider=provider,
        tenant_id=tenant_id,
        code=code,
        state=state,
        code_verifier=code_verifier,
        expected_state=expected_state
    )

    if result["action"] == "link_required":
        return {
            "action": "link_required",
            "link_data": {
                "user_id": result["user_id"],
                "provider": result["provider"],
                "provider_user_id": result["provider_user_id"],
                "provider_email": result["provider_email"],
                "provider_name": result.get("provider_name")
            }
        }

    user = result["user"]
    access_token = create_jwt_token(user)
    refresh_token = create_refresh_token(user)

    return {
        "action": result["action"],
        "access_token": access_token,
        "expires_in": 900,  # 15 minutes
        "refresh_token": refresh_token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "role": user["role"]
        }
    }
"""
    })

    return workflow


# ─────────────────────────────────────────────────────────────────────────
# Register with Nexus
# ─────────────────────────────────────────────────────────────────────────

oauth_workflows = [
    create_oauth_start_workflow(),
    create_oauth_callback_workflow(),
]
```

---

## Phase 2: Frontend Implementation

### 2.1 Login Page

```typescript
// src/app/(auth)/login/page.tsx
"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";

// Provider icons
import { AzureIcon, GoogleIcon, GitHubIcon } from "@/components/icons";

const SSO_PROVIDERS = [
  { id: "azure", name: "Microsoft", icon: AzureIcon, color: "bg-[#00A4EF]" },
  { id: "google", name: "Google", icon: GoogleIcon, color: "bg-white border" },
  { id: "github", name: "GitHub", icon: GitHubIcon, color: "bg-[#24292F]" },
] as const;

export default function LoginPage() {
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [ssoLoading, setSsoLoading] = useState<string | null>(null);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // ... email login logic
  };

  const handleSSOLogin = async (provider: string) => {
    setSsoLoading(provider);

    try {
      const response = await fetch(`/api/auth/oauth/${provider}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ return_url: returnUrl }),
      });

      const data = await response.json();

      // Store state and code_verifier in sessionStorage for callback
      sessionStorage.setItem("oauth_state", data.state);
      sessionStorage.setItem("oauth_code_verifier", data.code_verifier);
      sessionStorage.setItem("oauth_provider", provider);
      sessionStorage.setItem("oauth_return_url", returnUrl);

      // Redirect to provider
      window.location.href = data.auth_url;
    } catch (error) {
      console.error("SSO error:", error);
      setSsoLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Sign in to ARC</CardTitle>
          <CardDescription>
            Investment management platform
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* SSO Buttons */}
          <div className="space-y-3">
            {SSO_PROVIDERS.map((provider) => {
              const Icon = provider.icon;
              const isLoadingThis = ssoLoading === provider.id;

              return (
                <Button
                  key={provider.id}
                  variant="outline"
                  className="w-full h-11 gap-3"
                  onClick={() => handleSSOLogin(provider.id)}
                  disabled={!!ssoLoading}
                >
                  {isLoadingThis ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                  Continue with {provider.name}
                </Button>
              );
            })}
          </div>

          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
              OR
            </span>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="password">Password</Label>
                <a
                  href="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </a>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign in
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <a href="/register" className="text-primary hover:underline">
              Sign up
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 2.2 OAuth Callback Handler

```typescript
// src/app/auth/callback/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";

type CallbackState = "loading" | "success" | "link_required" | "error";

interface LinkData {
  user_id: string;
  provider: string;
  provider_user_id: string;
  provider_email: string;
  provider_name?: string;
}

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuthStore();

  const [state, setState] = useState<CallbackState>("loading");
  const [error, setError] = useState<string>("");
  const [linkData, setLinkData] = useState<LinkData | null>(null);

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      const code = searchParams.get("code");
      const returnedState = searchParams.get("state");
      const errorParam = searchParams.get("error");

      if (errorParam) {
        throw new Error(searchParams.get("error_description") || errorParam);
      }

      if (!code || !returnedState) {
        throw new Error("Missing authorization code or state");
      }

      // Retrieve stored values
      const storedState = sessionStorage.getItem("oauth_state");
      const codeVerifier = sessionStorage.getItem("oauth_code_verifier");
      const provider = sessionStorage.getItem("oauth_provider");
      const returnUrl = sessionStorage.getItem("oauth_return_url") || "/dashboard";

      if (!storedState || !codeVerifier || !provider) {
        throw new Error("Session expired. Please try again.");
      }

      // Exchange code for tokens
      const response = await fetch(`/api/auth/oauth/${provider}/callback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          state: returnedState,
          code_verifier: codeVerifier,
          expected_state: storedState,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Authentication failed");
      }

      // Clear stored values
      sessionStorage.removeItem("oauth_state");
      sessionStorage.removeItem("oauth_code_verifier");
      sessionStorage.removeItem("oauth_provider");
      sessionStorage.removeItem("oauth_return_url");

      if (data.action === "link_required") {
        setLinkData(data.link_data);
        setState("link_required");
        return;
      }

      // Success - store auth and redirect
      setAuth(data.user, data.access_token);
      setState("success");

      setTimeout(() => {
        router.push(returnUrl);
      }, 1000);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setState("error");
    }
  };

  const handleLinkAccount = async (confirm: boolean) => {
    if (!confirm || !linkData) {
      router.push("/login");
      return;
    }

    try {
      setState("loading");

      const response = await fetch(`/api/auth/link/${linkData.provider}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(linkData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to link account");
      }

      setAuth(data.user, data.access_token);
      setState("success");
      router.push("/dashboard");

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to link account");
      setState("error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          {state === "loading" && (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
              <p className="mt-4 text-muted-foreground">
                Completing sign in...
              </p>
            </div>
          )}

          {state === "success" && (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
              <p className="mt-4 font-medium">Sign in successful!</p>
              <p className="text-sm text-muted-foreground">
                Redirecting to dashboard...
              </p>
            </div>
          )}

          {state === "link_required" && linkData && (
            <div className="space-y-4">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-amber-500" />
                <h2 className="mt-4 text-lg font-semibold">
                  Account Already Exists
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  An account with email <strong>{linkData.provider_email}</strong> already exists.
                  Would you like to link your {linkData.provider} account to it?
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleLinkAccount(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => handleLinkAccount(true)}
                >
                  Link Account
                </Button>
              </div>
            </div>
          )}

          {state === "error" && (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
              <p className="mt-4 font-medium text-destructive">
                Sign in failed
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{error}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push("/login")}
              >
                Back to Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

### 2.3 Linked Accounts Manager

```typescript
// src/components/settings/LinkedAccountsManager.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Link2, Unlink, Loader2, CheckCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { AzureIcon, GoogleIcon, GitHubIcon } from "@/components/icons";

interface LinkedAccount {
  id: string;
  provider_type: string;
  provider_email: string;
  provider_name?: string;
  linked_at: string;
  last_login_at?: string;
}

const PROVIDERS = [
  { id: "azure", name: "Microsoft Azure AD", icon: AzureIcon },
  { id: "google", name: "Google", icon: GoogleIcon },
  { id: "github", name: "GitHub", icon: GitHubIcon },
];

export function LinkedAccountsManager() {
  const queryClient = useQueryClient();
  const [unlinkProvider, setUnlinkProvider] = useState<string | null>(null);

  const { data: linkedAccounts = [], isLoading } = useQuery({
    queryKey: ["linked-accounts"],
    queryFn: async () => {
      const res = await fetch("/api/auth/linked-accounts");
      return res.json() as Promise<LinkedAccount[]>;
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: async (provider: string) => {
      const res = await fetch(`/api/auth/link/${provider}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to unlink");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["linked-accounts"] });
      toast.success("Account unlinked successfully");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to unlink");
    },
  });

  const handleLink = async (provider: string) => {
    try {
      const res = await fetch(`/api/auth/oauth/${provider}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ return_url: "/settings/security" }),
      });
      const data = await res.json();

      sessionStorage.setItem("oauth_state", data.state);
      sessionStorage.setItem("oauth_code_verifier", data.code_verifier);
      sessionStorage.setItem("oauth_provider", provider);
      sessionStorage.setItem("oauth_return_url", "/settings/security");

      window.location.href = data.auth_url;
    } catch (error) {
      toast.error("Failed to start linking process");
    }
  };

  const getLinkedAccount = (providerId: string) =>
    linkedAccounts.find((a) => a.provider_type === providerId);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Linked Accounts
          </CardTitle>
          <CardDescription>
            Connect your account to external identity providers for single sign-on.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {PROVIDERS.map((provider) => {
            const Icon = provider.icon;
            const linked = getLinkedAccount(provider.id);

            return (
              <div
                key={provider.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-muted">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-medium">{provider.name}</p>
                    {linked ? (
                      <p className="text-sm text-muted-foreground">
                        {linked.provider_email}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Not connected
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {linked && (
                    <Badge variant="secondary" className="gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Connected
                    </Badge>
                  )}

                  {linked ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUnlinkProvider(provider.id)}
                      disabled={unlinkMutation.isPending}
                    >
                      <Unlink className="h-4 w-4 mr-1" />
                      Unlink
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLink(provider.id)}
                    >
                      <Link2 className="h-4 w-4 mr-1" />
                      Connect
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Unlink Confirmation Dialog */}
      <AlertDialog open={!!unlinkProvider} onOpenChange={() => setUnlinkProvider(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlink Account?</AlertDialogTitle>
            <AlertDialogDescription>
              You won't be able to sign in with this provider anymore.
              You can always reconnect later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (unlinkProvider) {
                  unlinkMutation.mutate(unlinkProvider);
                  setUnlinkProvider(null);
                }
              }}
            >
              {unlinkMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Unlink
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
```

---

## Phase 3: Azure AD Multi-Tenant Setup

### 3.1 Azure App Registration

```bash
# 1. Login to Azure CLI
az login

# 2. Create app registration (multi-tenant)
az ad app create \
  --display-name "ARC Investment Platform" \
  --sign-in-audience "AzureADMultipleOrgs" \
  --web-redirect-uris "https://app.arc-invest.com/auth/callback" \
  --enable-id-token-issuance true

# 3. Get the Application (client) ID
az ad app list --display-name "ARC Investment Platform" --query "[0].appId" -o tsv

# 4. Create client secret
az ad app credential reset \
  --id <app-id> \
  --append \
  --display-name "Production Secret" \
  --years 2

# 5. Add API permissions
az ad app permission add \
  --id <app-id> \
  --api 00000003-0000-0000-c000-000000000000 \
  --api-permissions e1fe6dd8-ba31-4d61-89e7-88639da4683d=Scope  # User.Read
```

### 3.2 Environment Variables

```bash
# .env (Production)

# Azure AD - Multi-tenant
SSO_AZURE_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
SSO_AZURE_CLIENT_SECRET=your-client-secret-value
SSO_AZURE_TENANT_ID=common  # "common" for multi-tenant

# Google Workspace
SSO_GOOGLE_CLIENT_ID=xxxxxxxxxxxx.apps.googleusercontent.com
SSO_GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxx

# GitHub
SSO_GITHUB_CLIENT_ID=Iv1.xxxxxxxxxxxx
SSO_GITHUB_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# General
SSO_REDIRECT_BASE_URL=https://app.arc-invest.com
SSO_SECRET_ENCRYPTION_KEY=base64-encoded-32-byte-key
```

---

## Implementation Checklist

### Backend

- [ ] Create `SSOProvider` and `LinkedAccount` DataFlow models
- [ ] Implement `SSOService` with PKCE support
- [ ] Create OAuth start/callback workflows for Nexus
- [ ] Add token exchange and validation
- [ ] Implement user provisioning and linking logic
- [ ] Add client secret encryption/decryption
- [ ] Write integration tests with real OAuth flows

### Frontend

- [ ] Create login page with SSO buttons
- [ ] Implement OAuth callback handler
- [ ] Handle link-required flow with confirmation modal
- [ ] Update auth store for SSO tokens
- [ ] Create Linked Accounts Manager component
- [ ] Add security settings page with SSO section

### Configuration

- [ ] Register Azure AD app (multi-tenant)
- [ ] Configure Google OAuth client
- [ ] Create GitHub OAuth app
- [ ] Set up environment variables
- [ ] Document tenant-specific configuration

### Testing

- [ ] Unit tests for SSOService methods
- [ ] Integration tests for OAuth flows (mocked IdP)
- [ ] E2E tests for login → callback → dashboard
- [ ] Security audit for token handling
