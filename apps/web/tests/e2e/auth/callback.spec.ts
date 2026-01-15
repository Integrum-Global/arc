import { test, expect } from "@playwright/test";

test.describe("OAuth Callback Flow", () => {
  test.beforeEach(async ({ page, context }) => {
    // Setup sessionStorage before navigation
    await context.addInitScript(() => {
      sessionStorage.setItem("oauth_state", "test-state-123");
      sessionStorage.setItem("oauth_code_verifier", "test-verifier-xyz");
      sessionStorage.setItem("oauth_provider", "azure");
      sessionStorage.setItem("oauth_return_url", "/dashboard");
    });
  });

  test("should complete successful OAuth callback and redirect to dashboard", async ({
    page,
  }) => {
    // Mock successful API response
    await page.route("**/api/auth/oauth/azure/callback", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          action: "login",
          user: {
            id: "user-123",
            email: "test@example.com",
            name: "Test User",
            role: "viewer",
          },
          access_token: "jwt-token-123",
          expires_in: 900,
        }),
      });
    });

    // Navigate to callback with OAuth params
    await page.goto("/auth/callback?code=auth-code-123&state=test-state-123");

    // Should show loading state
    await expect(page.getByText("Completing sign in...")).toBeVisible();

    // Should show success state
    await expect(page.getByText("Sign in successful!")).toBeVisible();

    // Should redirect to dashboard
    await page.waitForURL("/dashboard");
  });

  test("should handle link_required flow", async ({ page }) => {
    // Mock link_required response
    await page.route("**/api/auth/oauth/azure/callback", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
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
    });

    await page.goto("/auth/callback?code=auth-code-123&state=test-state-123");

    // Should show link modal
    await expect(page.getByText("Account Already Exists")).toBeVisible();
    await expect(page.getByText(/test@example.com/i)).toBeVisible();

    // Should have Cancel and Link Account buttons
    await expect(page.getByRole("button", { name: /cancel/i })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /link account/i })
    ).toBeVisible();
  });

  test("should link account when user confirms", async ({ page }) => {
    // Mock initial callback response
    await page.route("**/api/auth/oauth/azure/callback", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          action: "link_required",
          link_data: {
            user_id: "user-123",
            provider: "azure",
            provider_user_id: "azure-user-456",
            provider_email: "test@example.com",
          },
        }),
      });
    });

    // Mock link account success
    await page.route("**/api/auth/link/azure", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: {
            id: "user-123",
            email: "test@example.com",
            name: "Test User",
            role: "viewer",
          },
          access_token: "jwt-token-123",
          expires_in: 900,
        }),
      });
    });

    await page.goto("/auth/callback?code=auth-code-123&state=test-state-123");

    // Wait for modal and click Link Account
    await page.getByRole("button", { name: /link account/i }).click();

    // Should show success and redirect
    await expect(page.getByText("Sign in successful!")).toBeVisible();
    await page.waitForURL("/dashboard");
  });

  test("should cancel link and redirect to login", async ({ page }) => {
    await page.route("**/api/auth/oauth/azure/callback", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          action: "link_required",
          link_data: {
            user_id: "user-123",
            provider: "azure",
            provider_user_id: "azure-user-456",
            provider_email: "test@example.com",
          },
        }),
      });
    });

    await page.goto("/auth/callback?code=auth-code-123&state=test-state-123");

    // Click Cancel button
    await page.getByRole("button", { name: /cancel/i }).click();

    // Should redirect to login
    await page.waitForURL("/login");
  });

  test("should display error when OAuth provider returns error", async ({
    page,
  }) => {
    await page.goto(
      "/auth/callback?error=access_denied&error_description=User%20canceled%20authentication"
    );

    await expect(page.getByText("Sign in failed")).toBeVisible();
    await expect(
      page.getByText("User canceled authentication")
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /back to login/i })
    ).toBeVisible();
  });

  test("should display error when code is missing", async ({ page }) => {
    await page.goto("/auth/callback?state=test-state-123");

    await expect(page.getByText("Sign in failed")).toBeVisible();
    await expect(
      page.getByText(/missing authorization code or state/i)
    ).toBeVisible();
  });

  test("should display error when sessionStorage is missing", async ({
    page,
    context,
  }) => {
    // Clear sessionStorage
    await context.addInitScript(() => {
      sessionStorage.clear();
    });

    await page.goto("/auth/callback?code=auth-code-123&state=test-state-123");

    await expect(page.getByText("Sign in failed")).toBeVisible();
    await expect(page.getByText(/session expired/i)).toBeVisible();
  });

  test("should display error when API returns error", async ({ page }) => {
    await page.route("**/api/auth/oauth/azure/callback", async (route) => {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          message: "Invalid authorization code",
        }),
      });
    });

    await page.goto("/auth/callback?code=invalid-code&state=test-state-123");

    await expect(page.getByText("Sign in failed")).toBeVisible();
    await expect(page.getByText("Invalid authorization code")).toBeVisible();
  });

  test("should clear sessionStorage after successful login", async ({
    page,
    context,
  }) => {
    await page.route("**/api/auth/oauth/azure/callback", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          action: "login",
          user: {
            id: "user-123",
            email: "test@example.com",
            name: "Test User",
            role: "viewer",
          },
          access_token: "jwt-token-123",
          expires_in: 900,
        }),
      });
    });

    await page.goto("/auth/callback?code=auth-code-123&state=test-state-123");

    // Wait for success
    await expect(page.getByText("Sign in successful!")).toBeVisible();

    // Check sessionStorage is cleared
    const sessionStorageItems = await page.evaluate(() => {
      return {
        state: sessionStorage.getItem("oauth_state"),
        verifier: sessionStorage.getItem("oauth_code_verifier"),
        provider: sessionStorage.getItem("oauth_provider"),
        returnUrl: sessionStorage.getItem("oauth_return_url"),
      };
    });

    expect(sessionStorageItems.state).toBeNull();
    expect(sessionStorageItems.verifier).toBeNull();
    expect(sessionStorageItems.provider).toBeNull();
    expect(sessionStorageItems.returnUrl).toBeNull();
  });

  test("should redirect to custom returnUrl from sessionStorage", async ({
    page,
    context,
  }) => {
    await context.addInitScript(() => {
      sessionStorage.setItem("oauth_state", "test-state-123");
      sessionStorage.setItem("oauth_code_verifier", "test-verifier-xyz");
      sessionStorage.setItem("oauth_provider", "azure");
      sessionStorage.setItem("oauth_return_url", "/settings/security");
    });

    await page.route("**/api/auth/oauth/azure/callback", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          action: "login",
          user: {
            id: "user-123",
            email: "test@example.com",
            name: "Test User",
            role: "viewer",
          },
          access_token: "jwt-token-123",
          expires_in: 900,
        }),
      });
    });

    await page.goto("/auth/callback?code=auth-code-123&state=test-state-123");

    // Should redirect to custom returnUrl
    await page.waitForURL("/settings/security");
  });

  test("should handle link account API failure", async ({ page }) => {
    await page.route("**/api/auth/oauth/azure/callback", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          action: "link_required",
          link_data: {
            user_id: "user-123",
            provider: "azure",
            provider_user_id: "azure-user-456",
            provider_email: "test@example.com",
          },
        }),
      });
    });

    // Mock link failure
    await page.route("**/api/auth/link/azure", async (route) => {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          message: "Failed to link account",
        }),
      });
    });

    await page.goto("/auth/callback?code=auth-code-123&state=test-state-123");

    await page.getByRole("button", { name: /link account/i }).click();

    // Should show error
    await expect(page.getByText("Sign in failed")).toBeVisible();
    await expect(page.getByText(/failed to link account/i)).toBeVisible();
  });
});
