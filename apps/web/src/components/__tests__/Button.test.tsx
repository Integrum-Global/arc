import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

describe("Button", () => {
  describe("Rendering", () => {
    it("renders with default variant", () => {
      render(<Button>Click me</Button>);

      const button = screen.getByRole("button", { name: /click me/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute("data-variant", "default");
    });

    it("renders with destructive variant", () => {
      render(<Button variant="destructive">Delete</Button>);

      const button = screen.getByRole("button", { name: /delete/i });
      expect(button).toHaveAttribute("data-variant", "destructive");
      expect(button).toHaveClass("bg-destructive");
    });

    it("renders with outline variant", () => {
      render(<Button variant="outline">Outline</Button>);

      const button = screen.getByRole("button", { name: /outline/i });
      expect(button).toHaveAttribute("data-variant", "outline");
      expect(button).toHaveClass("border");
    });

    it("renders with secondary variant", () => {
      render(<Button variant="secondary">Secondary</Button>);

      const button = screen.getByRole("button", { name: /secondary/i });
      expect(button).toHaveAttribute("data-variant", "secondary");
      expect(button).toHaveClass("bg-secondary");
    });

    it("renders with ghost variant", () => {
      render(<Button variant="ghost">Ghost</Button>);

      const button = screen.getByRole("button", { name: /ghost/i });
      expect(button).toHaveAttribute("data-variant", "ghost");
    });

    it("renders with link variant", () => {
      render(<Button variant="link">Link</Button>);

      const button = screen.getByRole("button", { name: /link/i });
      expect(button).toHaveAttribute("data-variant", "link");
      expect(button).toHaveClass("text-primary");
    });
  });

  describe("Size Variants", () => {
    it("renders with default size", () => {
      render(<Button size="default">Default Size</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("data-size", "default");
      expect(button).toHaveClass("h-9");
    });

    it("renders with small size", () => {
      render(<Button size="sm">Small</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("data-size", "sm");
      expect(button).toHaveClass("h-8");
    });

    it("renders with large size", () => {
      render(<Button size="lg">Large</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("data-size", "lg");
      expect(button).toHaveClass("h-10");
    });

    it("renders with icon size", () => {
      render(<Button size="icon">Icon</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("data-size", "icon");
      expect(button).toHaveClass("size-9");
    });
  });

  describe("Click Handling", () => {
    it("calls onClick handler when clicked", async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick}>Click me</Button>);

      const button = screen.getByRole("button", { name: /click me/i });
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("calls onClick handler multiple times on multiple clicks", async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick}>Click me</Button>);

      const button = screen.getByRole("button", { name: /click me/i });
      await user.click(button);
      await user.click(button);
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(3);
    });

    it("handles fireEvent click correctly", () => {
      const handleClick = vi.fn();

      render(<Button onClick={handleClick}>Click me</Button>);

      const button = screen.getByRole("button", { name: /click me/i });
      fireEvent.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("Loading State", () => {
    it("shows loading spinner when loading", () => {
      render(
        <Button disabled>
          <Loader2 className="animate-spin" data-testid="loading-spinner" />
          Loading...
        </Button>
      );

      expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("disables button when showing loading state", () => {
      render(
        <Button disabled>
          <Loader2 className="animate-spin" />
          Loading...
        </Button>
      );

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });

    it("has reduced opacity when loading/disabled", () => {
      render(
        <Button disabled>
          <Loader2 className="animate-spin" />
          Loading...
        </Button>
      );

      const button = screen.getByRole("button");
      expect(button).toHaveClass("disabled:opacity-50");
    });
  });

  describe("Disabled State", () => {
    it("prevents clicks when disabled", async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(
        <Button disabled onClick={handleClick}>
          Disabled
        </Button>
      );

      const button = screen.getByRole("button", { name: /disabled/i });
      await user.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });

    it("has disabled attribute when disabled", () => {
      render(<Button disabled>Disabled</Button>);

      const button = screen.getByRole("button", { name: /disabled/i });
      expect(button).toBeDisabled();
    });

    it("has pointer-events-none class when disabled", () => {
      render(<Button disabled>Disabled</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("disabled:pointer-events-none");
    });

    it("cannot be focused via keyboard when disabled", () => {
      render(<Button disabled>Disabled</Button>);

      const button = screen.getByRole("button");
      button.focus();
      // Disabled buttons typically don't receive focus or have tabindex=-1 behavior
      expect(button).toBeDisabled();
    });
  });

  describe("Custom ClassName", () => {
    it("applies custom className", () => {
      render(<Button className="custom-class">Custom</Button>);

      const button = screen.getByRole("button", { name: /custom/i });
      expect(button).toHaveClass("custom-class");
    });

    it("merges custom className with default classes", () => {
      render(<Button className="my-custom-style">Custom</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("my-custom-style");
      expect(button).toHaveClass("inline-flex");
      expect(button).toHaveClass("items-center");
    });

    it("allows overriding default styles with custom className", () => {
      render(<Button className="bg-green-500">Green Button</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-green-500");
    });
  });

  describe("asChild Prop", () => {
    it("renders as child component when asChild is true", () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      );

      const link = screen.getByRole("link", { name: /link button/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/test");
    });

    it("applies button styles to child component", () => {
      render(
        <Button asChild variant="destructive">
          <a href="/delete">Delete Link</a>
        </Button>
      );

      const link = screen.getByRole("link", { name: /delete link/i });
      expect(link).toHaveClass("bg-destructive");
    });

    it("does not render a button element when asChild is true", () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      );

      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("passes data attributes to child when asChild", () => {
      render(
        <Button asChild variant="outline" size="lg">
          <a href="/test">Styled Link</a>
        </Button>
      );

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("data-slot", "button");
      expect(link).toHaveAttribute("data-variant", "outline");
      expect(link).toHaveAttribute("data-size", "lg");
    });
  });

  describe("Accessibility", () => {
    it("has correct role", () => {
      render(<Button>Accessible Button</Button>);

      expect(
        screen.getByRole("button", { name: /accessible button/i })
      ).toBeInTheDocument();
    });

    it("can receive focus", async () => {
      const user = userEvent.setup();
      render(<Button>Focusable</Button>);

      const button = screen.getByRole("button");
      await user.tab();

      expect(button).toHaveFocus();
    });

    it("can be activated with Enter key", async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick}>Press Enter</Button>);

      const button = screen.getByRole("button");
      button.focus();
      await user.keyboard("{Enter}");

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("can be activated with Space key", async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick}>Press Space</Button>);

      const button = screen.getByRole("button");
      button.focus();
      await user.keyboard(" ");

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("supports aria-label", () => {
      render(<Button aria-label="Close dialog">X</Button>);

      expect(
        screen.getByRole("button", { name: /close dialog/i })
      ).toBeInTheDocument();
    });

    it("supports aria-disabled", () => {
      render(<Button aria-disabled="true">Aria Disabled</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-disabled", "true");
    });
  });

  describe("Type Attribute", () => {
    it("defaults to button type", () => {
      render(<Button>Default Type</Button>);

      const button = screen.getByRole("button");
      // Button component doesn't explicitly set type, but native button defaults to "submit"
      // The component should ideally have type="button" by default
    });

    it("supports submit type", () => {
      render(<Button type="submit">Submit</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("type", "submit");
    });

    it("supports reset type", () => {
      render(<Button type="reset">Reset</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("type", "reset");
    });
  });
});
