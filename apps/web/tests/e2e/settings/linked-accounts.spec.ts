/**
 * E2E tests for Linked Accounts Manager
 * Tests the complete SSO account linking/unlinking flow
 */

import { test, expect } from "@playwright/test";

// Mock API endpoints
test.beforeEach(async ({ page }) => {
  // Mock authentication
  await page.route("/api/v1/auth/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "user-1",
        email: "test@example.com",
        name: "Test User",
        role: "admin",
      }),
    });
  });

  // Mock dashboard data (for navigation)
  await page.route("/api/v1/portfolios?limit=10", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ items: [], total: 0, page: 1, limit: 10 }),
    });
  });
});

test.describe("Linked Accounts Manager", () => {
  test.describe("Initial State", () => {
    test("displays all three SSO providers", async ({ page }) => {
      // Mock empty linked accounts
      await page.route("/api/v1/auth/linked-accounts", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([]),
        });
      });

      await page.goto("/settings/security");

      // Wait for component to load
      await expect(page.getByText("Linked Accounts")).toBeVisible();

      // Check all providers are displayed
      await expect(page.getByText("Microsoft Azure AD")).toBeVisible();
      await expect(page.getByText("Google")).toBeVisible();
      await expect(page.getByText("GitHub")).toBeVisible();

      // All should show "Not connected"
      const notConnectedElements = page.getByText("Not connected");
      await expect(notConnectedElements).toHaveCount(3);
    });

    test("displays linked accounts with Connected badge", async ({ page }) => {
      // Mock linked Azure account
      await page.route("/api/v1/auth/linked-accounts", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "link-1",
              provider_type: "azure",
              provider_email: "user@company.com",
              provider_name: "Test User",
              linked_at: "2024-01-01T00:00:00Z",
              last_login_at: "2024-01-10T00:00:00Z",
            },
          ]),
        });
      });

      await page.goto("/settings/security");

      // Check linked account details
      await expect(page.getByText("user@company.com")).toBeVisible();
      await expect(page.getByText("Connected")).toBeVisible();

      // Should have Unlink button for linked account
      const unlinkButton = page
        .locator("div")
        .filter({ hasText: "Microsoft Azure AD" })
        .getByRole("button", { name: /Unlink/i });
      await expect(unlinkButton).toBeVisible();

      // Should have Connect buttons for other providers
      const connectButtons = page.getByRole("button", { name: /Connect/i });
      await expect(connectButtons).toHaveCount(2); // Google and GitHub
    });
  });

  test.describe("Linking Accounts", () => {
    test("initiates OAuth flow when clicking Connect", async ({ page }) => {
      // Mock empty linked accounts
      await page.route("/api/v1/auth/linked-accounts", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([]),
        });
      });

      // Mock OAuth start endpoint
      let oauthCalled = false;
      await page.route("/api/v1/auth/oauth/azure", async (route) => {
        oauthCalled = true;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            auth_url: "https://login.microsoftonline.com/authorize?...",
            state: "test-state-123",
            code_verifier: "test-verifier-456",
          }),
        });
      });

      await page.goto("/settings/security");

      // Click Connect on Azure
      const azureSection = page
        .locator("div")
        .filter({ hasText: "Microsoft Azure AD" });
      const connectButton = azureSection.getByRole("button", {
        name: /Connect/i,
      });

      // Prevent actual navigation
      await page.route(
        "https://login.microsoftonline.com/authorize?**",
        async (route) => {
          await route.abort();
        }
      );

      await connectButton.click();

      // Verify OAuth endpoint was called
      await page.waitForTimeout(500);
      expect(oauthCalled).toBe(true);
    });

    test("stores OAuth state in sessionStorage", async ({ page }) => {
      await page.route("/api/v1/auth/linked-accounts", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([]),
        });
      });

      await page.route("/api/v1/auth/oauth/google", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            auth_url: "https://accounts.google.com/o/oauth2/v2/auth?...",
            state: "google-state-789",
            code_verifier: "google-verifier-012",
          }),
        });
      });

      await page.goto("/settings/security");

      const googleSection = page.locator("div").filter({ hasText: "Google" });
      const connectButton = googleSection
        .getByRole("button", { name: /Connect/i })
        .first();

      await page.route(
        "https://accounts.google.com/o/oauth2/v2/auth?**",
        async (route) => {
          await route.abort();
        }
      );

      await connectButton.click();

      // Check sessionStorage
      const oauthState = await page.evaluate(() =>
        sessionStorage.getItem("oauth_state")
      );
      const oauthVerifier = await page.evaluate(() =>
        sessionStorage.getItem("oauth_code_verifier")
      );
      const oauthProvider = await page.evaluate(() =>
        sessionStorage.getItem("oauth_provider")
      );

      expect(oauthState).toBe("google-state-789");
      expect(oauthVerifier).toBe("google-verifier-012");
      expect(oauthProvider).toBe("google");
    });
  });

  test.describe("Unlinking Accounts", () => {
    test("shows confirmation dialog when clicking Unlink", async ({ page }) => {
      await page.route("/api/v1/auth/linked-accounts", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "link-1",
              provider_type: "azure",
              provider_email: "user@company.com",
              provider_name: "Test User",
              linked_at: "2024-01-01T00:00:00Z",
            },
          ]),
        });
      });

      await page.goto("/settings/security");

      // Click Unlink button
      const unlinkButton = page
        .locator("div")
        .filter({ hasText: "Microsoft Azure AD" })
        .getByRole("button", { name: /Unlink/i });
      await unlinkButton.click();

      // Check confirmation dialog appears
      await expect(page.getByText("Unlink Account?")).toBeVisible();
      await expect(
        page.getByText(/You won't be able to sign in with this provider/)
      ).toBeVisible();

      // Check buttons
      await expect(page.getByRole("button", { name: /Cancel/i })).toBeVisible();
      await expect(
        page.getByRole("button", { name: /^Unlink$/i })
      ).toBeVisible();
    });

    test("closes dialog when clicking Cancel", async ({ page }) => {
      await page.route("/api/v1/auth/linked-accounts", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "link-1",
              provider_type: "github",
              provider_email: "user@github.com",
              provider_name: "Test User",
              linked_at: "2024-01-01T00:00:00Z",
            },
          ]),
        });
      });

      await page.goto("/settings/security");

      // Open dialog
      const unlinkButton = page
        .locator("div")
        .filter({ hasText: "GitHub" })
        .getByRole("button", { name: /Unlink/i });
      await unlinkButton.click();

      await expect(page.getByText("Unlink Account?")).toBeVisible();

      // Click Cancel
      await page.getByRole("button", { name: /Cancel/i }).click();

      // Dialog should close
      await expect(page.getByText("Unlink Account?")).not.toBeVisible();
    });

    test("unlinks account when confirming", async ({ page }) => {
      // Initial linked accounts
      await page.route("/api/v1/auth/linked-accounts", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "link-1",
              provider_type: "azure",
              provider_email: "user@company.com",
              provider_name: "Test User",
              linked_at: "2024-01-01T00:00:00Z",
            },
            {
              id: "link-2",
              provider_type: "google",
              provider_email: "user@gmail.com",
              provider_name: "Test User",
              linked_at: "2024-01-02T00:00:00Z",
            },
          ]),
        });
      });

      // Mock unlink endpoint
      let unlinkCalled = false;
      await page.route("/api/v1/auth/link/azure", async (route) => {
        if (route.request().method() === "DELETE") {
          unlinkCalled = true;
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({}),
          });
        }
      });

      await page.goto("/settings/security");

      // Click Unlink on Azure
      const unlinkButton = page
        .locator("div")
        .filter({ hasText: "Microsoft Azure AD" })
        .getByRole("button", { name: /Unlink/i });
      await unlinkButton.click();

      // Confirm unlink
      await page.getByRole("button", { name: /^Unlink$/i }).click();

      // Verify DELETE was called
      await page.waitForTimeout(500);
      expect(unlinkCalled).toBe(true);
    });

    test("shows success toast after unlinking", async ({ page }) => {
      await page.route("/api/v1/auth/linked-accounts", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "link-1",
              provider_type: "google",
              provider_email: "user@gmail.com",
              provider_name: "Test User",
              linked_at: "2024-01-01T00:00:00Z",
            },
          ]),
        });
      });

      await page.route("/api/v1/auth/link/google", async (route) => {
        if (route.request().method() === "DELETE") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({}),
          });
        }
      });

      await page.goto("/settings/security");

      // Unlink account
      const unlinkButton = page
        .locator("div")
        .filter({ hasText: "Google" })
        .getByRole("button", { name: /Unlink/i });
      await unlinkButton.click();
      await page.getByRole("button", { name: /^Unlink$/i }).click();

      // Check for success toast (sonner toast)
      await expect(
        page.getByText("Account unlinked successfully")
      ).toBeVisible({ timeout: 3000 });
    });

    test("shows error toast when unlink fails", async ({ page }) => {
      await page.route("/api/v1/auth/linked-accounts", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "link-1",
              provider_type: "github",
              provider_email: "user@github.com",
              provider_name: "Test User",
              linked_at: "2024-01-01T00:00:00Z",
            },
          ]),
        });
      });

      await page.route("/api/v1/auth/link/github", async (route) => {
        if (route.request().method() === "DELETE") {
          await route.fulfill({
            status: 400,
            contentType: "text/plain",
            body: "Cannot unlink last authentication method",
          });
        }
      });

      await page.goto("/settings/security");

      // Attempt to unlink
      const unlinkButton = page
        .locator("div")
        .filter({ hasText: "GitHub" })
        .getByRole("button", { name: /Unlink/i });
      await unlinkButton.click();
      await page.getByRole("button", { name: /^Unlink$/i }).click();

      // Check for error toast
      await expect(
        page.getByText(/Failed to unlink account/i)
      ).toBeVisible({ timeout: 3000 });
    });
  });

  test.describe("Responsive Design", () => {
    test("displays correctly on mobile", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await page.route("/api/v1/auth/linked-accounts", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([]),
        });
      });

      await page.goto("/settings/security");

      // Component should be visible and usable on mobile
      await expect(page.getByText("Linked Accounts")).toBeVisible();
      await expect(page.getByText("Microsoft Azure AD")).toBeVisible();

      // Buttons should be accessible
      const connectButtons = page.getByRole("button", { name: /Connect/i });
      await expect(connectButtons.first()).toBeVisible();
    });

    test("displays correctly on tablet", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      await page.route("/api/v1/auth/linked-accounts", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "link-1",
              provider_type: "azure",
              provider_email: "user@company.com",
              provider_name: "Test User",
              linked_at: "2024-01-01T00:00:00Z",
            },
          ]),
        });
      });

      await page.goto("/settings/security");

      await expect(page.getByText("Linked Accounts")).toBeVisible();
      await expect(page.getByText("user@company.com")).toBeVisible();
    });
  });

  test.describe("Accessibility", () => {
    test("has proper ARIA labels", async ({ page }) => {
      await page.route("/api/v1/auth/linked-accounts", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "link-1",
              provider_type: "azure",
              provider_email: "user@company.com",
              provider_name: "Test User",
              linked_at: "2024-01-01T00:00:00Z",
            },
          ]),
        });
      });

      await page.goto("/settings/security");

      // Check buttons have proper roles
      const unlinkButton = page.getByRole("button", { name: /Unlink/i });
      await expect(unlinkButton).toBeVisible();

      const connectButtons = page.getByRole("button", { name: /Connect/i });
      await expect(connectButtons.first()).toBeVisible();
    });

    test("dialog is keyboard navigable", async ({ page }) => {
      await page.route("/api/v1/auth/linked-accounts", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "link-1",
              provider_type: "azure",
              provider_email: "user@company.com",
              provider_name: "Test User",
              linked_at: "2024-01-01T00:00:00Z",
            },
          ]),
        });
      });

      await page.goto("/settings/security");

      // Open dialog
      const unlinkButton = page.getByRole("button", { name: /Unlink/i });
      await unlinkButton.click();

      // Dialog should have alertdialog role
      const dialog = page.getByRole("alertdialog");
      await expect(dialog).toBeVisible();

      // Tab through dialog buttons
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");

      // Escape should close dialog
      await page.keyboard.press("Escape");
      await expect(dialog).not.toBeVisible();
    });
  });
});
