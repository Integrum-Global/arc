"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCallback = async () => {
    try {
      // Extract URL parameters
      const code = searchParams.get("code");
      const returnedState = searchParams.get("state");
      const errorParam = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      // Check for error from IdP
      if (errorParam) {
        throw new Error(errorDescription || errorParam);
      }

      // Validate required parameters
      if (!code || !returnedState) {
        throw new Error("Missing authorization code or state");
      }

      // Retrieve stored values from sessionStorage
      const storedState = sessionStorage.getItem("oauth_state");
      const codeVerifier = sessionStorage.getItem("oauth_code_verifier");
      const provider = sessionStorage.getItem("oauth_provider");
      const returnUrl = sessionStorage.getItem("oauth_return_url") || "/dashboard";

      // Check for expired session
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

      // Handle link_required action
      if (data.action === "link_required") {
        setLinkData(data.link_data);
        setState("link_required");
        return;
      }

      // Success - clear sessionStorage
      sessionStorage.removeItem("oauth_state");
      sessionStorage.removeItem("oauth_code_verifier");
      sessionStorage.removeItem("oauth_provider");
      sessionStorage.removeItem("oauth_return_url");

      // Store auth and redirect
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

    // Store auth and redirect
    setAuth(user, accessToken);
    setState("success");

    setTimeout(() => {
      router.push("/dashboard");
    }, 1000);
  };

  const handleLinkCancel = () => {
    router.push("/login");
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
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-500" />
              </div>
              <p className="mt-4 font-medium">Sign in successful!</p>
              <p className="text-sm text-muted-foreground">
                Redirecting to dashboard...
              </p>
            </div>
          )}

          {state === "error" && (
            <div className="text-center py-8 space-y-4">
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="font-medium text-destructive">Sign in failed</p>
                <Alert variant="destructive" className="mt-4 text-left">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push("/login")}
              >
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
        onCancel={handleLinkCancel}
      />
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                <p className="mt-4 text-muted-foreground">Loading...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <OAuthCallbackContent />
    </Suspense>
  );
}
