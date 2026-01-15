# Frontend SSO Documentation

This document covers the frontend implementation of enterprise SSO for the ARC Investment Platform using Next.js and React.

---

## Table of Contents

1. [Login Page](#1-login-page)
2. [OAuth Callback Handler](#2-oauth-callback-handler)
3. [Linked Accounts Manager](#3-linked-accounts-manager)
4. [Integration Guide](#4-integration-guide)
5. [State Management](#5-state-management)

---

## 1. Login Page

**File**: `apps/web/src/app/(auth)/login/page.tsx`

### Overview

The login page displays SSO provider buttons alongside traditional email/password login.

### Implementation

```tsx
"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { AzureIcon, GoogleIcon, GitHubIcon } from "@/components/icons";

// SSO Provider configuration
const SSO_PROVIDERS = [
  { id: "azure" as const, name: "Microsoft", icon: AzureIcon },
  { id: "google" as const, name: "Google", icon: GoogleIcon },
  { id: "github" as const, name: "GitHub", icon: GitHubIcon },
];

type SSOProvider = "azure" | "google" | "github";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/dashboard";
  const [ssoLoading, setSsoLoading] = useState<SSOProvider | null>(null);

  const handleSSOLogin = async (provider: SSOProvider) => {
    setSsoLoading(provider);

    try {
      // 1. Request OAuth authorization URL from backend
      const response = await fetch(`/api/v1/auth/oauth/${provider}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: "default",
          return_url: returnUrl,
        }),
      });

      if (!response.ok) {
        throw new Error(`OAuth start failed: ${response.statusText}`);
      }

      const data = await response.json();

      // 2. Store PKCE values in sessionStorage (CRITICAL for security)
      sessionStorage.setItem("oauth_state", data.state);
      sessionStorage.setItem("oauth_code_verifier", data.code_verifier);
      sessionStorage.setItem("oauth_provider", provider);
      sessionStorage.setItem("oauth_return_url", returnUrl);

      // 3. Redirect to OAuth provider
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
        </CardHeader>

        <CardContent className="space-y-6">
          {/* SSO Buttons */}
          <div className="space-y-3">
            {SSO_PROVIDERS.map((provider) => {
              const Icon = provider.icon;
              const isLoading = ssoLoading === provider.id;

              return (
                <Button
                  key={provider.id}
                  variant="outline"
                  className="w-full h-11 gap-3"
                  onClick={() => handleSSOLogin(provider.id)}
                  disabled={!!ssoLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                  Continue with {provider.name}
                </Button>
              );
            })}
          </div>

          <Separator />

          {/* Email/Password form... */}
        </CardContent>
      </Card>
    </div>
  );
}
```

### Key Points

1. **PKCE Storage**: State and code_verifier stored in `sessionStorage` for callback validation
2. **Provider info**: Provider ID stored for callback routing
3. **Return URL**: Preserved for post-authentication redirect
4. **Loading states**: Disabled buttons during OAuth flow

---

## 2. OAuth Callback Handler

**File**: `apps/web/src/app/auth/callback/page.tsx`

### Overview

Handles the OAuth callback after user authenticates with the provider.

### Implementation

```tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";
import { LinkAccountModal } from "@/components/auth/LinkAccountModal";

type CallbackState = "loading" | "success" | "link_required" | "error";

interface LinkData {
  user_id: string;
  provider: string;
  provider_user_id: string;
  provider_email: string;
  provider_name?: string;
}

function OAuthCallbackContent() {
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
      // 1. Extract URL parameters from OAuth callback
      const code = searchParams.get("code");
      const returnedState = searchParams.get("state");
      const errorParam = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      // 2. Check for IdP errors
      if (errorParam) {
        throw new Error(errorDescription || errorParam);
      }

      if (!code || !returnedState) {
        throw new Error("Missing authorization code or state");
      }

      // 3. Retrieve stored PKCE values
      const storedState = sessionStorage.getItem("oauth_state");
      const codeVerifier = sessionStorage.getItem("oauth_code_verifier");
      const provider = sessionStorage.getItem("oauth_provider");
      const returnUrl = sessionStorage.getItem("oauth_return_url") || "/dashboard";

      if (!storedState || !codeVerifier || !provider) {
        throw new Error("Session expired. Please try again.");
      }

      // 4. Exchange code for tokens
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

      // 5. Handle link_required action
      if (data.action === "link_required") {
        setLinkData(data.link_data);
        setState("link_required");
        return;
      }

      // 6. Success - clear storage and redirect
      sessionStorage.removeItem("oauth_state");
      sessionStorage.removeItem("oauth_code_verifier");
      sessionStorage.removeItem("oauth_provider");
      sessionStorage.removeItem("oauth_return_url");

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

  const handleLinkSuccess = (user: any, accessToken: string) => {
    // Clear sessionStorage
    sessionStorage.removeItem("oauth_state");
    sessionStorage.removeItem("oauth_code_verifier");
    sessionStorage.removeItem("oauth_provider");
    sessionStorage.removeItem("oauth_return_url");

    setAuth(user, accessToken);
    setState("success");
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          {state === "loading" && (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
              <p className="mt-4 text-muted-foreground">Completing sign in...</p>
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

          {state === "error" && (
            <div className="text-center py-8 space-y-4">
              <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
              <p className="font-medium text-destructive">Sign in failed</p>
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button variant="outline" onClick={() => router.push("/login")}>
                Back to Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Link Account Modal */}
      <LinkAccountModal
        open={state === "link_required"}
        linkData={linkData}
        onSuccess={handleLinkSuccess}
        onCancel={() => router.push("/login")}
      />
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <OAuthCallbackContent />
    </Suspense>
  );
}
```

### Flow States

| State | Description | UI |
|-------|-------------|-----|
| `loading` | Exchanging code for tokens | Spinner |
| `success` | Authentication complete | Checkmark, redirect |
| `link_required` | Email matches existing user | Link confirmation modal |
| `error` | Authentication failed | Error message, back button |

---

## 3. Linked Accounts Manager

**File**: `apps/web/src/components/settings/LinkedAccountsManager.tsx`

### Overview

Settings component for managing SSO provider links.

### Implementation

```tsx
"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link2, Unlink, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { useLinkedAccounts, useAuthMethods, useLinkAccount, useUnlinkAccount, type LinkedAccount } from "@/hooks/useLinkedAccounts";
import { AzureIcon, GoogleIcon, GitHubIcon } from "@/components/icons/providers";

interface Provider {
  id: "azure" | "google" | "github";
  displayName: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PROVIDERS: Provider[] = [
  { id: "azure", displayName: "Microsoft Azure AD", icon: AzureIcon },
  { id: "google", displayName: "Google Workspace", icon: GoogleIcon },
  { id: "github", displayName: "GitHub", icon: GitHubIcon },
];

export function LinkedAccountsManager() {
  const [unlinkDialog, setUnlinkDialog] = useState<{
    provider: Provider | null;
    account: LinkedAccount | null;
  }>({ provider: null, account: null });

  // Query hooks
  const { data: linkedAccounts = [], isPending: isLoading } = useLinkedAccounts();
  const { data: authMethods } = useAuthMethods();

  // Mutation hooks
  const linkMutation = useLinkAccount();
  const unlinkMutation = useUnlinkAccount();

  // Determine if user can unlink (has password OR multiple links)
  const canUnlink = useMemo(() => {
    const hasPassword = authMethods?.has_password ?? false;
    return hasPassword || linkedAccounts.length > 1;
  }, [authMethods?.has_password, linkedAccounts.length]);

  const handleLink = (provider: string) => {
    linkMutation.mutate(provider);
  };

  const handleUnlinkClick = (provider: Provider, account: LinkedAccount) => {
    setUnlinkDialog({ provider, account });
  };

  const handleUnlinkConfirm = () => {
    if (unlinkDialog.provider) {
      unlinkMutation.mutate(unlinkDialog.provider.id);
      setUnlinkDialog({ provider: null, account: null });
    }
  };

  const getLinkedAccount = (providerId: string): LinkedAccount | undefined =>
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
            const isLastAuthMethod = !canUnlink && linked;

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
                    <p className="font-medium">{provider.displayName}</p>
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
                    isLastAuthMethod ? (
                      // Cannot unlink - show disabled with tooltip
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="sm" disabled>
                              <AlertTriangle className="h-4 w-4 mr-1 text-amber-500" />
                              Unlink
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Cannot unlink last authentication method.</p>
                            <p className="text-xs text-muted-foreground">
                              Set a password first.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      // Can unlink
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnlinkClick(provider, linked)}
                        disabled={unlinkMutation.isPending}
                      >
                        <Unlink className="h-4 w-4 mr-1" />
                        Unlink
                      </Button>
                    )
                  ) : (
                    // Connect button
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLink(provider.id)}
                      disabled={linkMutation.isPending}
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
      <AlertDialog open={!!unlinkDialog.provider} onOpenChange={() => setUnlinkDialog({ provider: null, account: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Unlink {unlinkDialog.provider?.displayName}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the connection between your ARC account and{" "}
              <strong>{unlinkDialog.account?.provider_email}</strong>.
              You won't be able to sign in with this provider until reconnected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnlinkConfirm}>
              {unlinkMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Unlink
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
```

### Features

- Lists all available SSO providers
- Shows connection status per provider
- Connect initiates OAuth flow
- Unlink with confirmation dialog
- Prevents unlinking last auth method

---

## 4. Integration Guide

### Adding SSO to a New Page

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AzureIcon } from "@/components/icons";

export function SSOButton() {
  const [isLoading, setIsLoading] = useState(false);

  const startSSOFlow = async (provider: string) => {
    setIsLoading(true);

    try {
      // 1. Call backend to get OAuth URL
      const response = await fetch(`/api/v1/auth/oauth/${provider}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: "default",
          return_url: window.location.pathname,
        }),
      });

      const data = await response.json();

      // 2. Store PKCE values for callback
      sessionStorage.setItem("oauth_state", data.state);
      sessionStorage.setItem("oauth_code_verifier", data.code_verifier);
      sessionStorage.setItem("oauth_provider", provider);
      sessionStorage.setItem("oauth_return_url", window.location.pathname);

      // 3. Redirect to provider
      window.location.href = data.auth_url;
    } catch (error) {
      console.error("SSO error:", error);
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={() => startSSOFlow("azure")} disabled={isLoading}>
      <AzureIcon className="h-5 w-5 mr-2" />
      Sign in with Microsoft
    </Button>
  );
}
```

### Custom Hooks (useLinkedAccounts)

```tsx
// hooks/useLinkedAccounts.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface LinkedAccount {
  id: string;
  provider_type: string;
  provider_email: string;
  provider_name?: string;
  linked_at: string;
  last_login_at?: string;
}

// Fetch linked accounts
export function useLinkedAccounts() {
  return useQuery({
    queryKey: ["linked-accounts"],
    queryFn: async () => {
      const res = await fetch("/api/auth/linked-accounts");
      return res.json() as Promise<LinkedAccount[]>;
    },
  });
}

// Check auth methods (password, linked accounts)
export function useAuthMethods() {
  return useQuery({
    queryKey: ["auth-methods"],
    queryFn: async () => {
      const res = await fetch("/api/auth/methods");
      return res.json() as Promise<{ has_password: boolean }>;
    },
  });
}

// Link account mutation
export function useLinkAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (provider: string) => {
      // Start OAuth flow for linking
      const res = await fetch(`/api/v1/auth/oauth/${provider}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: "default",
          return_url: "/settings/security",
        }),
      });

      const data = await res.json();

      // Store PKCE values
      sessionStorage.setItem("oauth_state", data.state);
      sessionStorage.setItem("oauth_code_verifier", data.code_verifier);
      sessionStorage.setItem("oauth_provider", provider);
      sessionStorage.setItem("oauth_return_url", "/settings/security");

      // Redirect to provider
      window.location.href = data.auth_url;
    },
    onError: () => {
      toast.error("Failed to start linking process");
    },
  });
}

// Unlink account mutation
export function useUnlinkAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (provider: string) => {
      const res = await fetch(`/api/auth/link/${provider}`, {
        method: "DELETE",
      });
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
}
```

---

## 5. State Management

### Auth Store (Zustand)

```tsx
// stores/authStore.ts
import { create } from "zustand";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  tenant_id: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,

  setAuth: (user, token) =>
    set({
      user,
      accessToken: token,
      isAuthenticated: true,
    }),

  clearAuth: () =>
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
    }),
}));
```

### SessionStorage Keys

| Key | Purpose | Cleared |
|-----|---------|---------|
| `oauth_state` | CSRF protection | After callback |
| `oauth_code_verifier` | PKCE verification | After callback |
| `oauth_provider` | Provider routing | After callback |
| `oauth_return_url` | Post-auth redirect | After callback |

---

## Related Documentation

- [SSO Overview](/docs/developers/00-sso-overview.md) - Architecture
- [Backend SSO](/docs/developers/01-sso-backend.md) - Service implementation
- [SSO Testing](/docs/developers/03-sso-testing.md) - Test strategies
- [Azure AD Setup](/docs/deployment/azure-ad-setup.md) - Provider configuration
