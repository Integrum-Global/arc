/**
 * React Query hooks for managing SSO linked accounts
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface LinkedAccount {
  id: string;
  provider_type: "azure" | "google" | "github";
  provider_email: string;
  provider_name?: string;
  linked_at: string;
  last_login_at?: string;
}

export interface AuthMethodsResponse {
  linked_accounts: LinkedAccount[];
  has_password: boolean;
}

/**
 * Hook to fetch linked accounts for current user
 */
export function useLinkedAccounts() {
  return useQuery({
    queryKey: ["linked-accounts"],
    queryFn: async (): Promise<LinkedAccount[]> => {
      const res = await fetch("/api/v1/auth/linked-accounts");
      if (!res.ok) {
        throw new Error("Failed to fetch linked accounts");
      }
      return res.json();
    },
  });
}

/**
 * Hook to fetch auth methods (linked accounts + password status)
 * Used to determine if unlinking is allowed
 */
export function useAuthMethods() {
  return useQuery({
    queryKey: ["auth-methods"],
    queryFn: async (): Promise<AuthMethodsResponse> => {
      const res = await fetch("/api/v1/auth/methods");
      if (!res.ok) {
        throw new Error("Failed to fetch auth methods");
      }
      return res.json();
    },
  });
}

/**
 * Hook to check if user can unlink a provider
 * Returns false if it's the last auth method (no password and only 1 linked account)
 */
export function useCanUnlink(linkedAccounts: LinkedAccount[], hasPassword: boolean) {
  // Can unlink if user has password OR has more than 1 linked account
  return hasPassword || linkedAccounts.length > 1;
}

/**
 * Hook to link a new SSO provider account
 * Initiates OAuth flow by redirecting to provider
 */
export function useLinkAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (provider: string) => {
      const res = await fetch(`/api/v1/auth/oauth/${provider}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: "default",
          return_url: "/settings/security",
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to start OAuth flow: ${await res.text()}`);
      }

      const data = await res.json();

      // Store OAuth state for callback
      sessionStorage.setItem("oauth_state", data.state);
      sessionStorage.setItem("oauth_code_verifier", data.code_verifier);
      sessionStorage.setItem("oauth_provider", provider);
      sessionStorage.setItem("oauth_return_url", "/settings/security");

      // Redirect to provider OAuth page
      window.location.href = data.auth_url;

      return data;
    },
    onError: (error: Error) => {
      toast.error("Failed to start linking process", {
        description: error.message,
      });
    },
  });
}

/**
 * Hook to unlink an SSO provider account
 */
export function useUnlinkAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (provider: string) => {
      const res = await fetch(`/api/v1/auth/link/${provider}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to unlink account");
      }

      return res.json();
    },
    onSuccess: () => {
      // Invalidate linked accounts query to refetch
      queryClient.invalidateQueries({ queryKey: ["linked-accounts"] });
      toast.success("Account unlinked successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to unlink account", {
        description: error.message,
      });
    },
  });
}
