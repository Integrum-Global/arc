import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LinkAccountModal } from "@/components/auth/LinkAccountModal";

describe("LinkAccountModal", () => {
  let fetchMock: any;
  const mockOnSuccess = vi.fn();
  const mockOnCancel = vi.fn();

  const defaultLinkData = {
    user_id: "user-123",
    provider: "azure",
    provider_user_id: "azure-user-456",
    provider_email: "test@example.com",
    provider_name: "Test User",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock = vi.fn();
    global.fetch = fetchMock;
  });

  describe("Modal Display", () => {
    it("should show modal when open is true", () => {
      render(
        <LinkAccountModal
          open={true}
          linkData={defaultLinkData}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText("Account Already Exists")).toBeInTheDocument();
      expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();
    });

    it("should not show modal when open is false", () => {
      render(
        <LinkAccountModal
          open={false}
          linkData={defaultLinkData}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.queryByText("Account Already Exists")).not.toBeInTheDocument();
    });

    it("should display provider email", () => {
      render(
        <LinkAccountModal
          open={true}
          linkData={defaultLinkData}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();
    });

    it("should display provider name in message", () => {
      render(
        <LinkAccountModal
          open={true}
          linkData={defaultLinkData}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(/azure/i)).toBeInTheDocument();
    });
  });

  describe("User Actions", () => {
    it("should call onCancel when Cancel button is clicked", () => {
      render(
        <LinkAccountModal
          open={true}
          linkData={defaultLinkData}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it("should call link API when Link Account button is clicked", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: { id: "user-123", email: "test@example.com", name: "Test", role: "viewer" },
          access_token: "jwt-token-123",
          expires_in: 900,
        }),
      });

      render(
        <LinkAccountModal
          open={true}
          linkData={defaultLinkData}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      const linkButton = screen.getByRole("button", { name: /link account/i });
      fireEvent.click(linkButton);

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          "/api/auth/link/azure",
          expect.objectContaining({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(defaultLinkData),
          })
        );
      });
    });

    it("should disable buttons during loading", async () => {
      (global.fetch as any).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(
        <LinkAccountModal
          open={true}
          linkData={defaultLinkData}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      const linkButton = screen.getByRole("button", { name: /link account/i });
      fireEvent.click(linkButton);

      await waitFor(() => {
        expect(linkButton).toBeDisabled();
        expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled();
      });
    });
  });

  describe("API Integration", () => {
    it("should call onSuccess with user and token on successful link", async () => {
      const mockResponse = {
        user: {
          id: "user-123",
          email: "test@example.com",
          name: "Test User",
          role: "viewer",
        },
        access_token: "jwt-token-123",
        expires_in: 900,
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(
        <LinkAccountModal
          open={true}
          linkData={defaultLinkData}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      const linkButton = screen.getByRole("button", { name: /link account/i });
      fireEvent.click(linkButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(
          mockResponse.user,
          mockResponse.access_token
        );
      });
    });

    it("should display error message on API failure", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          message: "Failed to link account",
        }),
      });

      render(
        <LinkAccountModal
          open={true}
          linkData={defaultLinkData}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      const linkButton = screen.getByRole("button", { name: /link account/i });
      fireEvent.click(linkButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to link account/i)).toBeInTheDocument();
      });

      // Should NOT call onSuccess on error
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it("should handle network errors", async () => {
      fetchMock.mockRejectedValueOnce(new Error("Network error"));

      render(
        <LinkAccountModal
          open={true}
          linkData={defaultLinkData}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      const linkButton = screen.getByRole("button", { name: /link account/i });
      fireEvent.click(linkButton);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle missing provider_name gracefully", () => {
      const linkDataWithoutName = {
        ...defaultLinkData,
        provider_name: undefined,
      };

      render(
        <LinkAccountModal
          open={true}
          linkData={linkDataWithoutName}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText("Account Already Exists")).toBeInTheDocument();
    });

    it("should not call API if linkData is null", () => {
      render(
        <LinkAccountModal
          open={true}
          linkData={null}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      // Modal shouldn't render at all with null linkData
      expect(screen.queryByText("Account Already Exists")).not.toBeInTheDocument();
    });
  });
});
