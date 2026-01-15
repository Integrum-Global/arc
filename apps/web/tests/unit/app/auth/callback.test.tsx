import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { useRouter, useSearchParams } from "next/navigation";
import OAuthCallbackPage from "@/app/auth/callback/page";
import { useAuthStore } from "@/stores/authStore";

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

// Mock auth store
vi.mock("@/stores/authStore", () => ({
  useAuthStore: vi.fn(),
}));

describe("OAuthCallbackPage", () => {
  let fetchMock: any;
  const mockPush = vi.fn();
  const mockSetAuth = vi.fn();
  let sessionStorageGetItemSpy: any;
  let sessionStorageRemoveItemSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup fetch mock
    fetchMock = vi.fn();
    global.fetch = fetchMock;

    // Setup router mock
    (useRouter as any).mockReturnValue({
      push: mockPush,
    });

    // Setup auth store mock
    (useAuthStore as any).mockReturnValue({
      setAuth: mockSetAuth,
    });

    // Setup sessionStorage with actual values
    const sessionStorageData: Record<string, string> = {
      oauth_state: "stored-state-123",
      oauth_code_verifier: "verifier-xyz",
      oauth_provider: "azure",
      oauth_return_url: "/dashboard",
    };

    Object.keys(sessionStorageData).forEach((key) => {
      sessionStorage.setItem(key, sessionStorageData[key]);
    });

    // Setup sessionStorage spies AFTER setting values
    sessionStorageGetItemSpy = vi.spyOn(Storage.prototype, "getItem");
    sessionStorageRemoveItemSpy = vi.spyOn(Storage.prototype, "removeItem");
  });

  afterEach(() => {
    sessionStorageGetItemSpy?.mockRestore();
    sessionStorageRemoveItemSpy?.mockRestore();
    sessionStorage.clear();
  });

  describe("URL Parameter Extraction", () => {
    it("should extract code and state from URL", async () => {
      const mockSearchParams = new Map([
        ["code", "auth-code-123"],
        ["state", "stored-state-123"],
      ]);

      (useSearchParams as any).mockReturnValue({
        get: (key: string) => mockSearchParams.get(key) || null,
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          action: "login",
          user: { id: "1", email: "test@example.com", name: "Test User", role: "viewer" },
          access_token: "jwt-token-123",
          expires_in: 900,
        }),
      });

      render(<OAuthCallbackPage />);

      // Wait for success message to appear
      await waitFor(() => expect(screen.getByText("Sign in successful!")).toBeInTheDocument(), {
        timeout: 3000,
      });

      // Verify fetch was called correctly
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/auth/oauth/azure/callback",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: expect.stringContaining("auth-code-123"),
        })
      );
    });

    it("should handle error parameter in URL", async () => {
      (useSearchParams as any).mockReturnValue({
        get: (key: string) => {
          const params: Record<string, string> = {
            error: "access_denied",
            error_description: "User canceled authentication",
          };
          return params[key] || null;
        },
      });

      render(<OAuthCallbackPage />);

      await waitFor(() => {
        expect(screen.getByText("Sign in failed")).toBeInTheDocument();
        expect(screen.getByText("User canceled authentication")).toBeInTheDocument();
      });
    });

    it("should handle missing code or state", async () => {
      (useSearchParams as any).mockReturnValue({
        get: () => null,
      });

      render(<OAuthCallbackPage />);

      await waitFor(() => {
        expect(screen.getByText("Sign in failed")).toBeInTheDocument();
        expect(screen.getByText(/Missing authorization code or state/i)).toBeInTheDocument();
      });
    });
  });

  describe("SessionStorage Retrieval", () => {
    it("should retrieve all required values from sessionStorage", async () => {
      (useSearchParams as any).mockReturnValue({
        get: (key: string) => {
          const params: Record<string, string> = {
            code: "auth-code-123",
            state: "stored-state-123",
          };
          return params[key] || null;
        },
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          action: "login",
          user: { id: "1", email: "test@example.com", name: "Test", role: "viewer" },
          access_token: "jwt-token",
          expires_in: 900,
        }),
      });

      render(<OAuthCallbackPage />);

      // Wait for success - this proves sessionStorage was retrieved correctly
      await waitFor(() => {
        expect(screen.getByText("Sign in successful!")).toBeInTheDocument();
      });

      // Verify the correct provider endpoint was called
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/auth/oauth/azure/callback",
        expect.objectContaining({
          method: "POST",
        })
      );
    });

    it("should handle expired session (missing sessionStorage values)", async () => {
      // Clear sessionStorage
      sessionStorage.clear();

      (useSearchParams as any).mockReturnValue({
        get: (key: string) => {
          const params: Record<string, string> = {
            code: "auth-code-123",
            state: "state-123",
          };
          return params[key] || null;
        },
      });

      render(<OAuthCallbackPage />);

      await waitFor(() => {
        expect(screen.getByText("Sign in failed")).toBeInTheDocument();
        expect(screen.getByText(/Session expired/i)).toBeInTheDocument();
      });
    });

    it("should use default return URL if not in sessionStorage", async () => {
      // Remove the return URL from sessionStorage
      sessionStorage.removeItem("oauth_return_url");

      (useSearchParams as any).mockReturnValue({
        get: (key: string) => {
          const params: Record<string, string> = {
            code: "auth-code-123",
            state: "stored-state-123",
          };
          return params[key] || null;
        },
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          action: "login",
          user: { id: "1", email: "test@example.com", name: "Test", role: "viewer" },
          access_token: "jwt-token",
          expires_in: 900,
        }),
      });

      render(<OAuthCallbackPage />);

      // Wait for success and redirect
      await waitFor(() => {
        expect(screen.getByText("Sign in successful!")).toBeInTheDocument();
      });

      // Wait for redirect (with timeout for setTimeout)
      await waitFor(
        () => {
          expect(mockPush).toHaveBeenCalledWith("/dashboard");
        },
        { timeout: 2000 }
      );
    });
  });

  describe("State Validation", () => {
    it("should reject mismatched state parameters", async () => {
      (useSearchParams as any).mockReturnValue({
        get: (key: string) => {
          const params: Record<string, string> = {
            code: "auth-code-123",
            state: "wrong-state",
          };
          return params[key] || null;
        },
      });

      fetchMock.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          message: "Invalid state parameter",
        }),
      });

      render(<OAuthCallbackPage />);

      await waitFor(() => {
        expect(screen.getByText("Sign in failed")).toBeInTheDocument();
      });
    });
  });

  describe("Token Exchange Flow", () => {
    it("should call callback endpoint with correct parameters", async () => {
      (useSearchParams as any).mockReturnValue({
        get: (key: string) => {
          const params: Record<string, string> = {
            code: "auth-code-123",
            state: "stored-state-123",
          };
          return params[key] || null;
        },
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          action: "login",
          user: { id: "1", email: "test@example.com", name: "Test", role: "viewer" },
          access_token: "jwt-token-123",
          expires_in: 900,
        }),
      });

      render(<OAuthCallbackPage />);

      await waitFor(() => {
        const callArgs = fetchMock.mock.calls[0];
        expect(callArgs[0]).toBe("/api/auth/oauth/azure/callback");

        const body = JSON.parse(callArgs[1].body);
        expect(body).toEqual({
          code: "auth-code-123",
          state: "stored-state-123",
          code_verifier: "verifier-xyz",
          expected_state: "stored-state-123",
        });
      });
    });

    it("should handle successful login and store JWT", async () => {
      (useSearchParams as any).mockReturnValue({
        get: (key: string) => {
          const params: Record<string, string> = {
            code: "auth-code-123",
            state: "stored-state-123",
          };
          return params[key] || null;
        },
      });

      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        name: "Test User",
        role: "viewer",
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          action: "login",
          user: mockUser,
          access_token: "jwt-token-123",
          expires_in: 900,
        }),
      });

      render(<OAuthCallbackPage />);

      await waitFor(() => {
        expect(mockSetAuth).toHaveBeenCalledWith(mockUser, "jwt-token-123");
      });
    });

    it("should clear sessionStorage after successful login", async () => {
      (useSearchParams as any).mockReturnValue({
        get: (key: string) => {
          const params: Record<string, string> = {
            code: "auth-code-123",
            state: "stored-state-123",
          };
          return params[key] || null;
        },
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          action: "login",
          user: { id: "1", email: "test@example.com", name: "Test", role: "viewer" },
          access_token: "jwt-token",
          expires_in: 900,
        }),
      });

      render(<OAuthCallbackPage />);

      // Wait for success
      await waitFor(() => {
        expect(screen.getByText("Sign in successful!")).toBeInTheDocument();
      });

      // Verify sessionStorage was cleared
      expect(sessionStorage.getItem("oauth_state")).toBeNull();
      expect(sessionStorage.getItem("oauth_code_verifier")).toBeNull();
      expect(sessionStorage.getItem("oauth_provider")).toBeNull();
      expect(sessionStorage.getItem("oauth_return_url")).toBeNull();
    });

    it("should redirect to returnUrl after success", async () => {
      // Set custom return URL
      sessionStorage.setItem("oauth_return_url", "/settings/security");

      (useSearchParams as any).mockReturnValue({
        get: (key: string) => {
          const params: Record<string, string> = {
            code: "auth-code-123",
            state: "stored-state-123",
          };
          return params[key] || null;
        },
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          action: "login",
          user: { id: "1", email: "test@example.com", name: "Test", role: "viewer" },
          access_token: "jwt-token",
          expires_in: 900,
        }),
      });

      render(<OAuthCallbackPage />);

      // Wait for success and redirect
      await waitFor(() => {
        expect(screen.getByText("Sign in successful!")).toBeInTheDocument();
      });

      // Wait for redirect (with timeout for setTimeout)
      await waitFor(
        () => {
          expect(mockPush).toHaveBeenCalledWith("/settings/security");
        },
        { timeout: 2000 }
      );
    });
  });

  describe("Link Required Flow", () => {
    it("should display link modal when action is link_required", async () => {
      (useSearchParams as any).mockReturnValue({
        get: (key: string) => {
          const params: Record<string, string> = {
            code: "auth-code-123",
            state: "stored-state-123",
          };
          return params[key] || null;
        },
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          action: "link_required",
          link_data: {
            user_id: "user-123",
            provider: "azure",
            provider_user_id: "azure-user-456",
            provider_email: "test@example.com",
            provider_name: "Test User",
          },
        }),
      });

      render(<OAuthCallbackPage />);

      await waitFor(() => {
        expect(screen.getByText("Account Already Exists")).toBeInTheDocument();
        expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();
      });
    });

    it("should NOT clear sessionStorage when showing link modal", async () => {
      (useSearchParams as any).mockReturnValue({
        get: (key: string) => {
          const params: Record<string, string> = {
            code: "auth-code-123",
            state: "stored-state-123",
          };
          return params[key] || null;
        },
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          action: "link_required",
          link_data: {
            user_id: "user-123",
            provider: "azure",
            provider_user_id: "azure-user-456",
            provider_email: "test@example.com",
          },
        }),
      });

      render(<OAuthCallbackPage />);

      await waitFor(() => {
        expect(screen.getByText("Account Already Exists")).toBeInTheDocument();
      });

      // SessionStorage should NOT be cleared yet
      expect(sessionStorageRemoveItemSpy).not.toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("should display error message and retry button", async () => {
      (useSearchParams as any).mockReturnValue({
        get: (key: string) => {
          const params: Record<string, string> = {
            code: "auth-code-123",
            state: "stored-state-123",
          };
          return params[key] || null;
        },
      });

      fetchMock.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          message: "Token exchange failed",
        }),
      });

      render(<OAuthCallbackPage />);

      await waitFor(() => {
        expect(screen.getByText("Sign in failed")).toBeInTheDocument();
        expect(screen.getByText("Token exchange failed")).toBeInTheDocument();
        expect(screen.getByText("Back to Login")).toBeInTheDocument();
      });
    });

    it("should handle network errors", async () => {
      (useSearchParams as any).mockReturnValue({
        get: (key: string) => {
          const params: Record<string, string> = {
            code: "auth-code-123",
            state: "stored-state-123",
          };
          return params[key] || null;
        },
      });

      fetchMock.mockRejectedValueOnce(new Error("Network error"));

      render(<OAuthCallbackPage />);

      await waitFor(() => {
        expect(screen.getByText("Sign in failed")).toBeInTheDocument();
        expect(screen.getByText("Network error")).toBeInTheDocument();
      });
    });
  });

  describe("UI States", () => {
    it("should show loading state initially", () => {
      (useSearchParams as any).mockReturnValue({
        get: (key: string) => {
          const params: Record<string, string> = {
            code: "auth-code-123",
            state: "stored-state-123",
          };
          return params[key] || null;
        },
      });

      fetchMock.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<OAuthCallbackPage />);

      expect(screen.getByText("Completing sign in...")).toBeInTheDocument();
    });

    it("should show success state before redirect", async () => {
      (useSearchParams as any).mockReturnValue({
        get: (key: string) => {
          const params: Record<string, string> = {
            code: "auth-code-123",
            state: "stored-state-123",
          };
          return params[key] || null;
        },
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          action: "login",
          user: { id: "1", email: "test@example.com", name: "Test", role: "viewer" },
          access_token: "jwt-token",
          expires_in: 900,
        }),
      });

      render(<OAuthCallbackPage />);

      await waitFor(() => {
        expect(screen.getByText("Sign in successful!")).toBeInTheDocument();
        expect(screen.getByText("Redirecting to dashboard...")).toBeInTheDocument();
      });
    });
  });
});
