/**
 * E2E Tests for Notification Preferences
 */

import { test, expect } from "@playwright/test";

test.describe("Notification Preferences", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to notification settings
    await page.goto("/settings/notifications");

    // Wait for page to load
    await expect(page.getByRole("heading", { name: "Notification Settings" })).toBeVisible();
  });

  test("should display all notification settings sections", async ({ page }) => {
    // Check global settings section
    await expect(page.getByText("Global Settings")).toBeVisible();
    await expect(page.getByText("Sound Notifications")).toBeVisible();
    await expect(page.getByText("Browser Notifications")).toBeVisible();
    await expect(page.getByText("Quiet Hours")).toBeVisible();

    // Check alert type settings section
    await expect(page.getByText("Alert Type Settings")).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Alert Type" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Sound" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Toast" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Email" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Badge" })).toBeVisible();
  });

  test("should display all 9 alert types", async ({ page }) => {
    await expect(page.getByText("Margin Call")).toBeVisible();
    await expect(page.getByText("Position Limit")).toBeVisible();
    await expect(page.getByText("System Failure")).toBeVisible();
    await expect(page.getByText("Threshold Breach")).toBeVisible();
    await expect(page.getByText("Health Issue")).toBeVisible();
    await expect(page.getByText("Concentration Warning")).toBeVisible();
    await expect(page.getByText("Price Change")).toBeVisible();
    await expect(page.getByText("Ratio Update")).toBeVisible();
    await expect(page.getByText("Performance Milestone")).toBeVisible();
  });

  test("should toggle sound notifications and enable save button", async ({ page }) => {
    // Find and click sound notifications switch
    const soundSwitch = page.getByRole("switch", { name: /sound notifications/i });
    const initialState = await soundSwitch.isChecked();

    await soundSwitch.click();

    // Verify switch toggled
    await expect(soundSwitch).toHaveAttribute("data-state", initialState ? "unchecked" : "checked");

    // Verify save button is enabled
    const saveButton = page.getByRole("button", { name: /save changes/i });
    await expect(saveButton).toBeEnabled();
  });

  test("should enable quiet hours and show time pickers", async ({ page }) => {
    // Enable quiet hours
    const quietHoursSwitch = page.getByRole("switch", { name: /quiet hours/i });
    await quietHoursSwitch.click();

    // Wait for time pickers to appear
    await expect(page.getByText("Start Time")).toBeVisible();
    await expect(page.getByText("End Time")).toBeVisible();

    // Verify save button is enabled
    const saveButton = page.getByRole("button", { name: /save changes/i });
    await expect(saveButton).toBeEnabled();
  });

  test("should save notification preferences successfully", async ({ page }) => {
    // Make a change
    const soundSwitch = page.getByRole("switch", { name: /sound notifications/i });
    await soundSwitch.click();

    // Click save button
    const saveButton = page.getByRole("button", { name: /save changes/i });
    await saveButton.click();

    // Wait for success toast
    await expect(page.getByText(/notification preferences updated successfully/i)).toBeVisible();

    // Verify save button is disabled again
    await expect(saveButton).toBeDisabled();
  });

  test("should persist preferences after reload", async ({ page }) => {
    // Make a change and save
    const soundSwitch = page.getByRole("switch", { name: /sound notifications/i });
    const initialState = await soundSwitch.isChecked();

    await soundSwitch.click();

    const saveButton = page.getByRole("button", { name: /save changes/i });
    await saveButton.click();

    // Wait for success
    await expect(page.getByText(/notification preferences updated successfully/i)).toBeVisible();

    // Reload page
    await page.reload();
    await expect(page.getByRole("heading", { name: "Notification Settings" })).toBeVisible();

    // Verify change persisted
    const soundSwitchAfterReload = page.getByRole("switch", { name: /sound notifications/i });
    await expect(soundSwitchAfterReload).toHaveAttribute(
      "data-state",
      initialState ? "unchecked" : "checked"
    );
  });

  test("should reset form to defaults", async ({ page }) => {
    // Make a change
    const soundSwitch = page.getByRole("switch", { name: /sound notifications/i });
    const initialState = await soundSwitch.isChecked();

    await soundSwitch.click();

    // Verify change
    await expect(soundSwitch).toHaveAttribute("data-state", initialState ? "unchecked" : "checked");

    // Click reset button
    const resetButton = page.getByRole("button", { name: /reset to defaults/i });
    await resetButton.click();

    // Verify reverted
    await expect(soundSwitch).toHaveAttribute("data-state", initialState ? "checked" : "unchecked");

    // Verify save button is disabled
    const saveButton = page.getByRole("button", { name: /save changes/i });
    await expect(saveButton).toBeDisabled();
  });

  test("should disable locked alert types", async ({ page }) => {
    // Find Margin Call row (locked)
    const marginCallRow = page.locator("tr", { has: page.getByText("Margin Call") });

    // All checkboxes in this row should be disabled
    const checkboxes = marginCallRow.getByRole("checkbox");
    const count = await checkboxes.count();

    for (let i = 0; i < count; i++) {
      await expect(checkboxes.nth(i)).toBeDisabled();
    }
  });

  test("should allow toggling configurable alert types", async ({ page }) => {
    // Find Price Change row (configurable)
    const priceChangeRow = page.locator("tr", { has: page.getByText("Price Change") });

    // Find enabled checkbox
    const enabledCheckbox = priceChangeRow.getByRole("checkbox", { name: /price change enabled/i });

    const initialState = await enabledCheckbox.isChecked();

    // Toggle it
    await enabledCheckbox.click();

    // Verify toggled
    await expect(enabledCheckbox).toHaveAttribute(
      "data-state",
      initialState ? "unchecked" : "checked"
    );

    // Verify save button is enabled
    const saveButton = page.getByRole("button", { name: /save changes/i });
    await expect(saveButton).toBeEnabled();
  });

  test("should allow toggling individual channels for configurable types", async ({ page }) => {
    // Find Threshold Breach row (configurable)
    const thresholdRow = page.locator("tr", { has: page.getByText("Threshold Breach") });

    // Find sound checkbox
    const soundCheckbox = thresholdRow.getByRole("checkbox", { name: /threshold breach sound/i });

    // If disabled (because alert type is disabled), enable the alert type first
    if (await soundCheckbox.isDisabled()) {
      const enabledCheckbox = thresholdRow.getByRole("checkbox", {
        name: /threshold breach enabled/i,
      });
      await enabledCheckbox.click();
    }

    const initialState = await soundCheckbox.isChecked();

    // Toggle sound channel
    await soundCheckbox.click();

    // Verify toggled
    await expect(soundCheckbox).toHaveAttribute(
      "data-state",
      initialState ? "unchecked" : "checked"
    );

    // Verify save button is enabled
    const saveButton = page.getByRole("button", { name: /save changes/i });
    await expect(saveButton).toBeEnabled();
  });

  test("should show lock icon for non-configurable types", async ({ page }) => {
    // Check for lock icons in margin call and system failure rows
    const marginCallRow = page.locator("tr", { has: page.getByText("Margin Call") });
    const systemFailureRow = page.locator("tr", { has: page.getByText("System Failure") });

    // Lock icons should be visible
    await expect(marginCallRow.locator("svg").first()).toBeVisible();
    await expect(systemFailureRow.locator("svg").first()).toBeVisible();
  });

  test("should disable save button when no changes", async ({ page }) => {
    const saveButton = page.getByRole("button", { name: /save changes/i });
    await expect(saveButton).toBeDisabled();
  });
});
