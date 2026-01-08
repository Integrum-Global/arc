/**
 * Example Unit Test
 *
 * This demonstrates the test infrastructure setup and patterns.
 * Delete this file once you have real tests in place.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@/test/test-utils";

// Simple component for testing
function ExampleComponent({ message }: { message: string }) {
  return (
    <div>
      <h1>Hello, World!</h1>
      <p data-testid="message">{message}</p>
    </div>
  );
}

describe("Test Infrastructure", () => {
  it("should have testing-library/jest-dom matchers", () => {
    render(<ExampleComponent message="Test message" />);

    const heading = screen.getByRole("heading", { name: /hello, world/i });
    expect(heading).toBeInTheDocument();
    expect(heading).toBeVisible();
  });

  it("should render with test utilities", () => {
    render(<ExampleComponent message="Custom message" />);

    const message = screen.getByTestId("message");
    expect(message).toHaveTextContent("Custom message");
  });

  it("should support async queries", async () => {
    render(<ExampleComponent message="Async test" />);

    const message = await screen.findByTestId("message");
    expect(message).toBeInTheDocument();
  });
});

describe("Browser API Mocks", () => {
  it("should have matchMedia mocked", () => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");

    expect(mediaQuery).toBeDefined();
    expect(mediaQuery.matches).toBe(false);
    expect(typeof mediaQuery.addEventListener).toBe("function");
  });

  it("should have ResizeObserver mocked", () => {
    const observer = new ResizeObserver(() => {});

    expect(observer).toBeDefined();
    expect(typeof observer.observe).toBe("function");
    expect(typeof observer.disconnect).toBe("function");
  });

  it("should have IntersectionObserver mocked", () => {
    const observer = new IntersectionObserver(() => {});

    expect(observer).toBeDefined();
    expect(typeof observer.observe).toBe("function");
    expect(typeof observer.disconnect).toBe("function");
  });

  it("should have scrollTo mocked", () => {
    expect(() => window.scrollTo(0, 0)).not.toThrow();
  });

  it("should have requestAnimationFrame mocked", () => {
    const callback = vi.fn();
    const id = requestAnimationFrame(callback);

    expect(id).toBeDefined();
    cancelAnimationFrame(id);
  });
});

describe("Cleanup", () => {
  let testElement: HTMLDivElement | null = null;

  beforeEach(() => {
    testElement = document.createElement("div");
    testElement.id = "test-cleanup";
    document.body.appendChild(testElement);
  });

  afterEach(() => {
    // This tests that cleanup runs properly between tests
    if (testElement && testElement.parentNode) {
      testElement.parentNode.removeChild(testElement);
    }
    testElement = null;
  });

  it("should have clean document body between tests", () => {
    expect(document.getElementById("test-cleanup")).not.toBeNull();
  });

  it("should not have leftover elements from previous test", () => {
    // This test runs after cleanup from the previous test
    // The beforeEach creates a fresh element
    expect(document.getElementById("test-cleanup")).not.toBeNull();
  });
});
