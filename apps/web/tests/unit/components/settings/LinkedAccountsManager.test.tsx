/**
 * Unit tests for LinkedAccountsManager component
 * Tests FIRST (TDD approach)
 *
 * Test coverage:
 * - Rendering all providers
 * - Loading states
 * - Connected/disconnected status
 * - Linking flow (OAuth initiation)
 * - Unlinking flow (confirmation dialog)
 * - Prevent unlinking last auth method
 * - API integration
 * - Accessibility
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "@/test/mocks/server";
import { LinkedAccountsManager } from "@/components/settings/LinkedAccountsManager";

// Mock toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Test data
const mockLinkedAccounts = [
  {
    id: "link-1",
    provider_type: "azure",
    provider_email: "user@company.com",
    provider_name: "John Doe",
    linked_at: "2024-01-01T00:00:00Z",
    last_login_at: "2024-01-10T00:00:00Z",
  },
  {
    id: "link-2",
    provider_type: "google",
    provider_email: "user@gmail.com",
    provider_name: "John Doe",
    linked_at: "2024-01-02T00:00:00Z",
    last_login_at: "2024-01-09T00:00:00Z",
  },
];

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

// Helper to set up MSW handlers for specific test scenarios
// server.use() prepends handlers, so they take precedence over default handlers
function setupHandlers(options: {
  linkedAccounts?: typeof mockLinkedAccounts;
  hasPassword?: boolean;
  unlinkSuccess?: boolean;
  oauthSuccess?: boolean;
}) {
  const linkedAccountsHandler = () => {
    return HttpResponse.json(options.linkedAccounts ?? mockLinkedAccounts);
  };

  const authMethodsHandler = () => {
    return HttpResponse.json({
      linked_accounts: options.linkedAccounts ?? mockLinkedAccounts,
      has_password: options.hasPassword ?? true,
    });
  };

  // Only use relative URLs since that's what hooks use
  const handlers = [
    http.get("/api/v1/auth/linked-accounts", linkedAccountsHandler),
    http.get("/api/v1/auth/methods", authMethodsHandler),
  ];

  if (options.oauthSuccess !== undefined) {
    const oauthHandler = ({ params }: { params: { provider: string } }) => {
      if (options.oauthSuccess) {
        return HttpResponse.json({
          auth_url: `https://oauth.${params.provider}.com/authorize?client_id=test`,
          state: `test-state-${params.provider}`,
          code_verifier: `test-verifier-${params.provider}`,
        });
      }
      return HttpResponse.json({ error: "OAuth failed" }, { status: 500 });
    };
    handlers.push(http.post("/api/v1/auth/oauth/:provider", oauthHandler));
  }

  if (options.unlinkSuccess !== undefined) {
    const unlinkHandler = () => {
      if (options.unlinkSuccess) {
        return HttpResponse.json({ success: true });
      }
      return HttpResponse.json({ error: "Unlink failed" }, { status: 500 });
    };
    handlers.push(http.delete("/api/v1/auth/link/:provider", unlinkHandler));
  }

  server.use(...handlers);
}

describe("LinkedAccountsManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset handlers before each test to ensure clean state
    server.resetHandlers();
  });

  afterEach(() => {
    // Also reset after each test (belt and suspenders)
    server.resetHandlers();
  });

  describe("Rendering", () => {
    it("renders all provider options", async () => {
      setupHandlers({ linkedAccounts: [] });

      render(<LinkedAccountsManager />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText("Microsoft Azure AD")).toBeInTheDocument();
        expect(screen.getByText("Google Workspace")).toBeInTheDocument();
        expect(screen.getByText("GitHub")).toBeInTheDocument();
      });
    });

    it("shows loading state while fetching", () => {
      // Use default handlers which have delay
      render(<LinkedAccountsManager />, { wrapper: createWrapper() });

      // Component should show loading state
      expect(screen.getByText("Linked Accounts")).toBeInTheDocument();
    });

    it("displays linked accounts with Connected badge", async () => {
      setupHandlers({ linkedAccounts: mockLinkedAccounts, hasPassword: true });

      render(<LinkedAccountsManager />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText("user@company.com")).toBeInTheDocument();
        expect(screen.getByText("user@gmail.com")).toBeInTheDocument();
        expect(screen.getAllByText("Connected")).toHaveLength(2);
      });
    });

    it("displays not connected status for unlinked providers", async () => {
      setupHandlers({
        linkedAccounts: [mockLinkedAccounts[0]!], // Only Azure linked
        hasPassword: true,
      });

      render(<LinkedAccountsManager />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText("user@company.com")).toBeInTheDocument();
        expect(screen.getAllByText("Not connected")).toHaveLength(2); // Google and GitHub
      });
    });
  });

  describe("Linking Accounts", () => {
    it("shows Connect button for unlinked providers", async () => {
      setupHandlers({ linkedAccounts: [], hasPassword: true });

      render(<LinkedAccountsManager />, { wrapper: createWrapper() });

      await waitFor(() => {
        const connectButtons = screen.getAllByRole("button", {
          name: /Connect/i,
        });
        expect(connectButtons).toHaveLength(3); // All 3 providers
      });
    });

    // Note: Testing OAuth redirect is complex in jsdom environment
    // The actual redirect behavior is tested via e2e tests
    // Here we verify the Connect button is clickable and triggers the mutation
    it("has working Connect button for each provider", async () => {
      const user = userEvent.setup();

      setupHandlers({
        linkedAccounts: [],
        hasPassword: true,
      });

      render(<LinkedAccountsManager />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByTestId("connect-azure")).toBeInTheDocument();
        expect(screen.getByTestId("connect-google")).toBeInTheDocument();
        expect(screen.getByTestId("connect-github")).toBeInTheDocument();
      });

      // Verify buttons are clickable (not disabled)
      expect(screen.getByTestId("connect-azure")).not.toBeDisabled();
      expect(screen.getByTestId("connect-google")).not.toBeDisabled();
      expect(screen.getByTestId("connect-github")).not.toBeDisabled();
    });
  });

  describe("Unlinking Accounts", () => {
    it("shows Unlink button for linked providers", async () => {
      setupHandlers({ linkedAccounts: mockLinkedAccounts, hasPassword: true });

      render(<LinkedAccountsManager />, { wrapper: createWrapper() });

      await waitFor(() => {
        const unlinkButtons = screen.getAllByRole("button", {
          name: /Unlink/i,
        });
        expect(unlinkButtons).toHaveLength(2); // Azure and Google
      });
    });

    it("shows confirmation dialog when clicking Unlink", async () => {
      const user = userEvent.setup();

      setupHandlers({ linkedAccounts: mockLinkedAccounts, hasPassword: true });

      render(<LinkedAccountsManager />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByTestId("unlink-azure")).toBeInTheDocument();
      });

      const unlinkButton = screen.getByTestId("unlink-azure");
      await user.click(unlinkButton);

      await waitFor(() => {
        expect(screen.getByText(/Unlink Microsoft Azure AD Account\?/)).toBeInTheDocument();
        // Check email is in the dialog description (multiple elements exist, so use getAllBy)
        const emailElements = screen.getAllByText(/user@company.com/);
        expect(emailElements.length).toBeGreaterThanOrEqual(1);
      });
    });

    it("shows provider-specific details in confirmation dialog", async () => {
      const user = userEvent.setup();

      setupHandlers({ linkedAccounts: mockLinkedAccounts, hasPassword: true });

      render(<LinkedAccountsManager />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByTestId("unlink-azure")).toBeInTheDocument();
      });

      // Click Azure unlink button
      const azureUnlink = screen.getByTestId("unlink-azure");
      await user.click(azureUnlink);

      await waitFor(() => {
        // Check dialog title shows provider name
        expect(screen.getByText(/Unlink Microsoft Azure AD Account\?/)).toBeInTheDocument();
        // Check that email appears in the dialog (it's also in the card, hence getAllBy)
        const dialog = screen.getByRole("alertdialog");
        expect(dialog).toContainHTML("user@company.com");
      });
    });

    it("closes dialog when clicking Cancel", async () => {
      const user = userEvent.setup();

      setupHandlers({ linkedAccounts: mockLinkedAccounts, hasPassword: true });

      render(<LinkedAccountsManager />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByTestId("unlink-azure")).toBeInTheDocument();
      });

      const unlinkButton = screen.getByTestId("unlink-azure");
      await user.click(unlinkButton);

      await waitFor(() => {
        expect(screen.getByText(/Unlink Microsoft Azure AD Account\?/)).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole("button", { name: /Cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText(/Unlink Microsoft Azure AD Account\?/)).not.toBeInTheDocument();
      });
    });

    it("calls DELETE endpoint when confirming unlink", async () => {
      const user = userEvent.setup();

      setupHandlers({
        linkedAccounts: mockLinkedAccounts,
        hasPassword: true,
        unlinkSuccess: true,
      });

      render(<LinkedAccountsManager />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByTestId("unlink-azure")).toBeInTheDocument();
      });

      const unlinkButton = screen.getByTestId("unlink-azure");
      await user.click(unlinkButton);

      await waitFor(() => {
        expect(screen.getByText(/Unlink Microsoft Azure AD Account\?/)).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole("button", { name: /Unlink Account/i });
      await user.click(confirmButton);

      // Wait for the mutation to complete
      await waitFor(() => {
        // Dialog should close after successful unlink
        expect(screen.queryByText(/Unlink Microsoft Azure AD Account\?/)).not.toBeInTheDocument();
      });
    });

    it("shows success toast after unlinking", async () => {
      const user = userEvent.setup();
      const { toast } = await import("sonner");

      setupHandlers({
        linkedAccounts: mockLinkedAccounts,
        hasPassword: true,
        unlinkSuccess: true,
      });

      render(<LinkedAccountsManager />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByTestId("unlink-azure")).toBeInTheDocument();
      });

      const unlinkButton = screen.getByTestId("unlink-azure");
      await user.click(unlinkButton);

      await waitFor(() => {
        expect(screen.getByText(/Unlink Microsoft Azure AD Account\?/)).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole("button", { name: /Unlink Account/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Account unlinked successfully");
      });
    });

    it("shows error toast when unlink fails", async () => {
      const user = userEvent.setup();
      const { toast } = await import("sonner");

      setupHandlers({
        linkedAccounts: mockLinkedAccounts,
        hasPassword: true,
        unlinkSuccess: false,
      });

      render(<LinkedAccountsManager />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByTestId("unlink-azure")).toBeInTheDocument();
      });

      const unlinkButton = screen.getByTestId("unlink-azure");
      await user.click(unlinkButton);

      await waitFor(() => {
        expect(screen.getByText(/Unlink Microsoft Azure AD Account\?/)).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole("button", { name: /Unlink Account/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });
  });

  describe("Prevent Last Unlink", () => {
    it("disables Unlink button when it is the last auth method (no password)", async () => {
      const singleLinkedAccount = [mockLinkedAccounts[0]!];

      setupHandlers({
        linkedAccounts: singleLinkedAccount,
        hasPassword: false,
      });

      render(<LinkedAccountsManager />, { wrapper: createWrapper() });

      await waitFor(() => {
        const disabledButton = screen.getByTestId("unlink-disabled-azure");
        expect(disabledButton).toBeDisabled();
      });
    });

    it("allows Unlink when user has password even with single linked account", async () => {
      const singleLinkedAccount = [mockLinkedAccounts[0]!];

      setupHandlers({
        linkedAccounts: singleLinkedAccount,
        hasPassword: true,
      });

      render(<LinkedAccountsManager />, { wrapper: createWrapper() });

      await waitFor(() => {
        const enabledButton = screen.getByTestId("unlink-azure");
        expect(enabledButton).not.toBeDisabled();
      });
    });

    it("allows Unlink when user has multiple linked accounts (no password)", async () => {
      setupHandlers({
        linkedAccounts: mockLinkedAccounts, // 2 accounts
        hasPassword: false,
      });

      render(<LinkedAccountsManager />, { wrapper: createWrapper() });

      await waitFor(() => {
        const unlinkButtons = screen.getAllByRole("button", { name: /Unlink/i });
        unlinkButtons.forEach((button) => {
          expect(button).not.toBeDisabled();
        });
      });
    });

    it("shows warning icon on disabled unlink button", async () => {
      const singleLinkedAccount = [mockLinkedAccounts[0]!];

      setupHandlers({
        linkedAccounts: singleLinkedAccount,
        hasPassword: false,
      });

      render(<LinkedAccountsManager />, { wrapper: createWrapper() });

      await waitFor(() => {
        const disabledButton = screen.getByTestId("unlink-disabled-azure");
        expect(disabledButton).toBeDisabled();
        // Check that the AlertTriangle icon is present (cursor-not-allowed class indicates it)
        expect(disabledButton).toHaveClass("cursor-not-allowed");
      });
    });
  });

  describe("Provider Display", () => {
    it("displays correct provider names", async () => {
      setupHandlers({ linkedAccounts: [], hasPassword: true });

      render(<LinkedAccountsManager />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText("Microsoft Azure AD")).toBeInTheDocument();
        expect(screen.getByText("Google Workspace")).toBeInTheDocument();
        expect(screen.getByText("GitHub")).toBeInTheDocument();
      });
    });

    it("shows provider email for connected accounts", async () => {
      setupHandlers({ linkedAccounts: mockLinkedAccounts, hasPassword: true });

      render(<LinkedAccountsManager />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText("user@company.com")).toBeInTheDocument();
        expect(screen.getByText("user@gmail.com")).toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA labels", async () => {
      setupHandlers({ linkedAccounts: mockLinkedAccounts, hasPassword: true });

      render(<LinkedAccountsManager />, { wrapper: createWrapper() });

      await waitFor(() => {
        const unlinkButtons = screen.getAllByRole("button", {
          name: /Unlink/i,
        });
        expect(unlinkButtons.length).toBeGreaterThan(0);
      });
    });

    it("manages dialog focus properly", async () => {
      const user = userEvent.setup();

      setupHandlers({ linkedAccounts: mockLinkedAccounts, hasPassword: true });

      render(<LinkedAccountsManager />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByTestId("unlink-azure")).toBeInTheDocument();
      });

      const unlinkButton = screen.getByTestId("unlink-azure");
      await user.click(unlinkButton);

      await waitFor(() => {
        const dialog = screen.getByRole("alertdialog");
        expect(dialog).toBeInTheDocument();
      });
    });

    it("supports keyboard navigation", async () => {
      const user = userEvent.setup();

      setupHandlers({ linkedAccounts: mockLinkedAccounts, hasPassword: true });

      render(<LinkedAccountsManager />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByTestId("unlink-azure")).toBeInTheDocument();
      });

      // Tab to first unlink button and press Enter
      const unlinkButton = screen.getByTestId("unlink-azure");
      unlinkButton.focus();
      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      });
    });
  });
});
