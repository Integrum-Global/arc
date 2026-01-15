/**
 * E2E Tests for Login Page
 * Tests SSO button redirects and form validation
 */

import { test, expect } from "@playwright/test";

const LOGIN_URL = "/login";

test.describe("Login Page E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(LOGIN_URL);
  });

  test.describe("Page Rendering", () => {
    test("should display login page with all elements", async ({ page }) => {
      // Title and description
      await expect(page.getByText("Sign in to ARC")).toBeVisible();
      await expect(
        page.getByText("Investment management platform")
      ).toBeVisible();

      // SSO buttons
      await expect(page.getByText("Continue with Microsoft")).toBeVisible();
      await expect(page.getByText("Continue with Google")).toBeVisible();
      await expect(page.getByText("Continue with GitHub")).toBeVisible();

      // OR separator
      await expect(page.getByText("OR")).toBeVisible();

      // Email/Password form
      await expect(page.getByLabel("Email")).toBeVisible();
      await expect(page.getByLabel("Password")).toBeVisible();
      await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();

      // Links
      await expect(page.getByText("Forgot password?")).toBeVisible();
      await expect(page.getByText("Sign up")).toBeVisible();
    });

    test("should have correct link hrefs", async ({ page }) => {
      const forgotPasswordLink = page.getByText("Forgot password?");
      await expect(forgotPasswordLink).toHaveAttribute("href", "/forgot-password");

      const signUpLink = page.getByText("Sign up");
      await expect(signUpLink).toHaveAttribute("href", "/register");
    });
  });

  test.describe("SSO Button Interactions", () => {
    test("should mock Azure SSO redirect", async ({ page }) => {
      // Mock the OAuth API endpoint
      await page.route("/api/v1/auth/oauth/azure", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            auth_url: "https://login.microsoftonline.com/test",
            state: "test-state-azure",
            code_verifier: "test-verifier-azure",
            return_url: "/dashboard",
          }),
        });
      });

      // Intercept navigation to IdP
      let redirectUrl = "";
      page.on("framenavigated", (frame) => {
        if (frame === page.mainFrame()) {
          redirectUrl = frame.url();
        }
      });

      // Click Azure button
      await page.getByText("Continue with Microsoft").click();

      // Wait for redirect
      await page.waitForTimeout(500);

      // Verify sessionStorage values were set
      const state = await page.evaluate(() => sessionStorage.getItem("oauth_state"));
      const verifier = await page.evaluate(() =>
        sessionStorage.getItem("oauth_code_verifier")
      );
      const provider = await page.evaluate(() =>
        sessionStorage.getItem("oauth_provider")
      );
      const returnUrl = await page.evaluate(() =>
        sessionStorage.getItem("oauth_return_url")
      );

      expect(state).toBe("test-state-azure");
      expect(verifier).toBe("test-verifier-azure");
      expect(provider).toBe("azure");
      expect(returnUrl).toBe("/dashboard");
    });

    test("should mock Google SSO redirect", async ({ page }) => {
      await page.route("/api/v1/auth/oauth/google", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            auth_url: "https://accounts.google.com/test",
            state: "test-state-google",
            code_verifier: "test-verifier-google",
            return_url: "/dashboard",
          }),
        });
      });

      await page.getByText("Continue with Google").click();

      await page.waitForTimeout(500);

      const provider = await page.evaluate(() =>
        sessionStorage.getItem("oauth_provider")
      );
      expect(provider).toBe("google");
    });

    test("should mock GitHub SSO redirect", async ({ page }) => {
      await page.route("/api/v1/auth/oauth/github", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            auth_url: "https://github.com/login/oauth/authorize",
            state: "test-state-github",
            code_verifier: "test-verifier-github",
            return_url: "/dashboard",
          }),
        });
      });

      await page.getByText("Continue with GitHub").click();

      await page.waitForTimeout(500);

      const provider = await page.evaluate(() =>
        sessionStorage.getItem("oauth_provider")
      );
      expect(provider).toBe("github");
    });

    test("should show loading spinner when SSO button is clicked", async ({
      page,
    }) => {
      // Delay the API response to see loading state
      await page.route("/api/v1/auth/oauth/azure", async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            auth_url: "https://login.microsoftonline.com/test",
            state: "test-state",
            code_verifier: "test-verifier",
            return_url: "/dashboard",
          }),
        });
      });

      const azureButton = page.getByText("Continue with Microsoft");
      await azureButton.click();

      // Check for loading spinner
      const spinner = page.locator('[data-testid="loading-spinner"]');
      await expect(spinner).toBeVisible();
    });

    test("should disable all buttons when one is loading", async ({ page }) => {
      await page.route("/api/v1/auth/oauth/azure", async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            auth_url: "https://login.microsoftonline.com/test",
            state: "test-state",
            code_verifier: "test-verifier",
            return_url: "/dashboard",
          }),
        });
      });

      await page.getByText("Continue with Microsoft").click();

      // All SSO buttons should be disabled
      await expect(page.getByText("Continue with Microsoft")).toBeDisabled();
      await expect(page.getByText("Continue with Google")).toBeDisabled();
      await expect(page.getByText("Continue with GitHub")).toBeDisabled();
    });
  });

  test.describe("Email/Password Form", () => {
    test("should allow typing in email and password fields", async ({
      page,
    }) => {
      const emailInput = page.getByLabel("Email");
      const passwordInput = page.getByLabel("Password");

      await emailInput.fill("test@example.com");
      await passwordInput.fill("password123");

      await expect(emailInput).toHaveValue("test@example.com");
      await expect(passwordInput).toHaveValue("password123");
    });

    test("should show validation for required fields", async ({ page }) => {
      const signInButton = page.getByRole("button", { name: /sign in/i });

      // Try to submit without filling fields
      await signInButton.click();

      // Browser native validation should prevent submission
      const emailInput = page.getByLabel("Email");
      const isValid = await emailInput.evaluate((el: HTMLInputElement) =>
        el.checkValidity()
      );
      expect(isValid).toBe(false);
    });

    test("should validate email format", async ({ page }) => {
      const emailInput = page.getByLabel("Email");

      await emailInput.fill("invalid-email");

      const isValid = await emailInput.evaluate((el: HTMLInputElement) =>
        el.checkValidity()
      );
      expect(isValid).toBe(false);
    });

    test("should accept valid email format", async ({ page }) => {
      const emailInput = page.getByLabel("Email");

      await emailInput.fill("valid@example.com");

      const isValid = await emailInput.evaluate((el: HTMLInputElement) =>
        el.checkValidity()
      );
      expect(isValid).toBe(true);
    });
  });

  test.describe("Return URL Handling", () => {
    test("should use custom return URL from query parameter", async ({
      page,
    }) => {
      await page.goto(`${LOGIN_URL}?returnUrl=/analytics`);

      await page.route("/api/v1/auth/oauth/azure", async (route) => {
        const request = route.request();
        const postData = request.postDataJSON();

        // Verify return URL is passed to API
        expect(postData.return_url).toBe("/analytics");

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            auth_url: "https://login.microsoftonline.com/test",
            state: "test-state",
            code_verifier: "test-verifier",
            return_url: "/analytics",
          }),
        });
      });

      await page.getByText("Continue with Microsoft").click();

      await page.waitForTimeout(500);

      const returnUrl = await page.evaluate(() =>
        sessionStorage.getItem("oauth_return_url")
      );
      expect(returnUrl).toBe("/analytics");
    });

    test("should default to /dashboard when no return URL provided", async ({
      page,
    }) => {
      await page.route("/api/v1/auth/oauth/google", async (route) => {
        const request = route.request();
        const postData = request.postDataJSON();

        expect(postData.return_url).toBe("/dashboard");

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            auth_url: "https://accounts.google.com/test",
            state: "test-state",
            code_verifier: "test-verifier",
            return_url: "/dashboard",
          }),
        });
      });

      await page.getByText("Continue with Google").click();

      await page.waitForTimeout(500);

      const returnUrl = await page.evaluate(() =>
        sessionStorage.getItem("oauth_return_url")
      );
      expect(returnUrl).toBe("/dashboard");
    });
  });

  test.describe("Responsive Design", () => {
    test("should display correctly on mobile", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await expect(page.getByText("Sign in to ARC")).toBeVisible();
      await expect(page.getByText("Continue with Microsoft")).toBeVisible();
      await expect(page.getByLabel("Email")).toBeVisible();
    });

    test("should display correctly on tablet", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      await expect(page.getByText("Sign in to ARC")).toBeVisible();
      await expect(page.getByText("Continue with Microsoft")).toBeVisible();
      await expect(page.getByLabel("Email")).toBeVisible();
    });

    test("should display correctly on desktop", async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });

      await expect(page.getByText("Sign in to ARC")).toBeVisible();
      await expect(page.getByText("Continue with Microsoft")).toBeVisible();
      await expect(page.getByLabel("Email")).toBeVisible();
    });
  });

  test.describe("Error Handling", () => {
    test("should handle OAuth API errors gracefully", async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          consoleErrors.push(msg.text());
        }
      });

      await page.route("/api/v1/auth/oauth/azure", async (route) => {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Internal server error" }),
        });
      });

      await page.getByText("Continue with Microsoft").click();

      await page.waitForTimeout(500);

      // Button should no longer be loading
      const spinner = page.locator('[data-testid="loading-spinner"]');
      await expect(spinner).not.toBeVisible();

      // Error should be logged
      expect(consoleErrors.some((err) => err.includes("SSO error"))).toBe(true);
    });
  });
});
