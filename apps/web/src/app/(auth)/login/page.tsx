"use client";

/**
 * Login Page with SSO Provider Buttons
 * Supports Azure AD, Google, and GitHub OAuth flows with PKCE
 */

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";

// Provider icons
import { AzureIcon, GoogleIcon, GitHubIcon } from "@/components/icons";

// SSO Provider configuration
const SSO_PROVIDERS = [
  {
    id: "azure" as const,
    name: "Microsoft",
    icon: AzureIcon,
    color: "bg-[#00A4EF]",
  },
  {
    id: "google" as const,
    name: "Google",
    icon: GoogleIcon,
    color: "bg-white border",
  },
  {
    id: "github" as const,
    name: "GitHub",
    icon: GitHubIcon,
    color: "bg-[#24292F]",
  },
];

type SSOProvider = "azure" | "google" | "github";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [ssoLoading, setSsoLoading] = useState<SSOProvider | null>(null);

  /**
   * Handle SSO login button click
   * Initiates OAuth flow with PKCE
   */
  const handleSSOLogin = async (provider: SSOProvider) => {
    setSsoLoading(provider);

    try {
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

      // Store OAuth state and PKCE verifier for callback verification (CRITICAL)
      sessionStorage.setItem("oauth_state", data.state);
      sessionStorage.setItem("oauth_code_verifier", data.code_verifier);
      sessionStorage.setItem("oauth_provider", provider);
      sessionStorage.setItem("oauth_return_url", returnUrl);

      // Redirect to IdP authorization page
      window.location.href = data.auth_url;
    } catch (error) {
      console.error("SSO error:", error);
      setSsoLoading(null);
    }
  };

  /**
   * Handle traditional email/password login
   */
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // TODO: Implement email/password login API call
      // For now, this is a placeholder
      console.log("Email login:", { email, password, returnUrl });

      // Example implementation:
      // const response = await fetch("/api/v1/auth/login", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ email, password }),
      // });
      //
      // if (response.ok) {
      //   const data = await response.json();
      //   // Store auth token
      //   localStorage.setItem("access_token", data.access_token);
      //   // Redirect to return URL
      //   window.location.href = returnUrl;
      // }
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Sign in to ARC</CardTitle>
          <CardDescription>Investment management platform</CardDescription>
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
                    <Loader2
                      className="h-5 w-5 animate-spin"
                      data-testid="loading-spinner"
                    />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                  Continue with {provider.name}
                </Button>
              );
            })}
          </div>

          {/* OR Separator */}
          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
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

          {/* Sign Up Link */}
          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <a href="/register" className="text-primary hover:underline">
              Sign up
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
