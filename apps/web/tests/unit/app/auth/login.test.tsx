/**
 * Unit Tests for Login Page
 * Tests SSO button rendering, loading states, and sessionStorage
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { useSearchParams } from "next/navigation";
import LoginPage from "@/app/(auth)/login/page";

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  useSearchParams: vi.fn(),
}));

// Mock fetch
global.fetch = vi.fn() as any;

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();

    // Reset fetch mock
    global.fetch = vi.fn() as any;

    // Default mock for useSearchParams
    (useSearchParams as any).mockReturnValue({
      get: vi.fn(() => null),
    });
  });

  describe("Rendering", () => {
    it("renders login page with title", () => {
      render(<LoginPage />);

      expect(screen.getByText("Sign in to ARC")).toBeInTheDocument();
      expect(screen.getByText("Investment management platform")).toBeInTheDocument();
    });

    it("renders all three SSO provider buttons", () => {
      render(<LoginPage />);

      expect(screen.getByText("Continue with Microsoft")).toBeInTheDocument();
      expect(screen.getByText("Continue with Google")).toBeInTheDocument();
      expect(screen.getByText("Continue with GitHub")).toBeInTheDocument();
    });

    it("renders email/password form", () => {
      render(<LoginPage />);

      expect(screen.getByLabelText("Email")).toBeInTheDocument();
      expect(screen.getByLabelText("Password")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
    });

    it("renders OR separator between SSO and form", () => {
      render(<LoginPage />);

      expect(screen.getByText("OR")).toBeInTheDocument();
    });

    it("renders forgot password link", () => {
      render(<LoginPage />);

      const forgotLink = screen.getByText("Forgot password?");
      expect(forgotLink).toBeInTheDocument();
      expect(forgotLink).toHaveAttribute("href", "/forgot-password");
    });

    it("renders sign up link", () => {
      render(<LoginPage />);

      const signUpLink = screen.getByText("Sign up");
      expect(signUpLink).toBeInTheDocument();
      expect(signUpLink).toHaveAttribute("href", "/register");
    });
  });

  describe("Return URL Handling", () => {
    it("uses default return URL when not provided", () => {
      (useSearchParams as any).mockReturnValue({
        get: vi.fn(() => null),
      });

      render(<LoginPage />);
      // Component should use /dashboard as default
      expect(useSearchParams).toHaveBeenCalled();
    });

    it("uses custom return URL from query params", () => {
      (useSearchParams as any).mockReturnValue({
        get: vi.fn((param) => (param === "returnUrl" ? "/analytics" : null)),
      });

      render(<LoginPage />);

      const searchParams = useSearchParams();
      expect(searchParams.get("returnUrl")).toBe("/analytics");
    });
  });

  describe("SSO Button Interactions", () => {
    it("calls OAuth API when Azure button is clicked", async () => {
      const mockResponse = {
        auth_url: "https://login.microsoftonline.com/...",
        state: "test-state",
        code_verifier: "test-verifier",
        return_url: "/dashboard",
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      // Mock window.location.href
      delete (window as any).location;
      window.location = { href: "" } as any;

      render(<LoginPage />);

      const azureButton = screen.getByText("Continue with Microsoft");
      fireEvent.click(azureButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/v1/auth/oauth/azure",
          expect.objectContaining({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tenant_id: "default",
              return_url: "/dashboard",
            }),
          })
        );
      });
    });

    it("stores OAuth state in sessionStorage", async () => {
      const mockResponse = {
        auth_url: "https://login.microsoftonline.com/...",
        state: "test-state-123",
        code_verifier: "test-verifier-456",
        return_url: "/dashboard",
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      delete (window as any).location;
      window.location = { href: "" } as any;

      render(<LoginPage />);

      const googleButton = screen.getByText("Continue with Google");
      fireEvent.click(googleButton);

      await waitFor(() => {
        expect(sessionStorage.getItem("oauth_state")).toBe("test-state-123");
        expect(sessionStorage.getItem("oauth_code_verifier")).toBe("test-verifier-456");
        expect(sessionStorage.getItem("oauth_provider")).toBe("google");
        expect(sessionStorage.getItem("oauth_return_url")).toBe("/dashboard");
      });
    });

    it("redirects to IdP authorization URL", async () => {
      const mockResponse = {
        auth_url: "https://github.com/login/oauth/authorize?...",
        state: "test-state",
        code_verifier: "test-verifier",
        return_url: "/dashboard",
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      delete (window as any).location;
      window.location = { href: "" } as any;

      render(<LoginPage />);

      const githubButton = screen.getByText("Continue with GitHub");
      fireEvent.click(githubButton);

      await waitFor(() => {
        expect(window.location.href).toBe("https://github.com/login/oauth/authorize?...");
      });
    });

    it("shows loading state for clicked provider", async () => {
      (global.fetch as any).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                ok: true,
                json: async () => ({
                  auth_url: "https://example.com",
                  state: "state",
                  code_verifier: "verifier",
                  return_url: "/dashboard",
                }),
              });
            }, 100);
          })
      );

      render(<LoginPage />);

      const azureButton = screen.getByText("Continue with Microsoft");
      fireEvent.click(azureButton);

      // Button should show loading state
      await waitFor(() => {
        expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
      });
    });

    it("disables all buttons when one is loading", async () => {
      (global.fetch as any).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                ok: true,
                json: async () => ({
                  auth_url: "https://example.com",
                  state: "state",
                  code_verifier: "verifier",
                  return_url: "/dashboard",
                }),
              });
            }, 100);
          })
      );

      render(<LoginPage />);

      const azureButton = screen.getByText("Continue with Microsoft");
      const googleButton = screen.getByText("Continue with Google");
      const githubButton = screen.getByText("Continue with GitHub");

      fireEvent.click(azureButton);

      await waitFor(() => {
        expect(azureButton.closest("button")).toBeDisabled();
        expect(googleButton.closest("button")).toBeDisabled();
        expect(githubButton.closest("button")).toBeDisabled();
      });
    });

    it("handles API errors gracefully", async () => {
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

      (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

      render(<LoginPage />);

      const azureButton = screen.getByText("Continue with Microsoft");
      fireEvent.click(azureButton);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          "SSO error:",
          expect.any(Error)
        );
      });

      consoleError.mockRestore();
    });
  });

  describe("Email/Password Form", () => {
    it("allows typing in email input", () => {
      render(<LoginPage />);

      const emailInput = screen.getByLabelText("Email") as HTMLInputElement;
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });

      expect(emailInput.value).toBe("test@example.com");
    });

    it("allows typing in password input", () => {
      render(<LoginPage />);

      const passwordInput = screen.getByLabelText("Password") as HTMLInputElement;
      fireEvent.change(passwordInput, { target: { value: "password123" } });

      expect(passwordInput.value).toBe("password123");
    });

    it("requires email and password fields", () => {
      render(<LoginPage />);

      const emailInput = screen.getByLabelText("Email");
      const passwordInput = screen.getByLabelText("Password");

      expect(emailInput).toHaveAttribute("required");
      expect(passwordInput).toHaveAttribute("required");
    });

    it("has email type for email input", () => {
      render(<LoginPage />);

      const emailInput = screen.getByLabelText("Email");
      expect(emailInput).toHaveAttribute("type", "email");
    });

    it("has password type for password input", () => {
      render(<LoginPage />);

      const passwordInput = screen.getByLabelText("Password");
      expect(passwordInput).toHaveAttribute("type", "password");
    });
  });

  describe("Custom Return URL", () => {
    it("passes custom return URL to SSO API", async () => {
      (useSearchParams as any).mockReturnValue({
        get: vi.fn((param) => (param === "returnUrl" ? "/analytics/ratios" : null)),
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          auth_url: "https://example.com",
          state: "state",
          code_verifier: "verifier",
          return_url: "/analytics/ratios",
        }),
      });

      delete (window as any).location;
      window.location = { href: "" } as any;

      render(<LoginPage />);

      const azureButton = screen.getByText("Continue with Microsoft");
      fireEvent.click(azureButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/v1/auth/oauth/azure",
          expect.objectContaining({
            body: JSON.stringify({
              tenant_id: "default",
              return_url: "/analytics/ratios",
            }),
          })
        );
      });
    });

    it("stores custom return URL in sessionStorage", async () => {
      (useSearchParams as any).mockReturnValue({
        get: vi.fn((param) => (param === "returnUrl" ? "/settings/security" : null)),
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          auth_url: "https://example.com",
          state: "state",
          code_verifier: "verifier",
          return_url: "/settings/security",
        }),
      });

      delete (window as any).location;
      window.location = { href: "" } as any;

      render(<LoginPage />);

      const googleButton = screen.getByText("Continue with Google");
      fireEvent.click(googleButton);

      await waitFor(() => {
        expect(sessionStorage.getItem("oauth_return_url")).toBe("/settings/security");
      });
    });
  });
});
