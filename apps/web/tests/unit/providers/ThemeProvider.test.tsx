import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ThemeProvider, useTheme } from "@/providers/ThemeProvider";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Mock matchMedia
const createMatchMedia = (matches: boolean) => {
  return vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
};

// Test component that exposes theme state
function TestComponent() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved-theme">{resolvedTheme}</span>
      <button data-testid="set-light" onClick={() => setTheme("light")}>
        Light
      </button>
      <button data-testid="set-dark" onClick={() => setTheme("dark")}>
        Dark
      </button>
      <button data-testid="set-system" onClick={() => setTheme("system")}>
        System
      </button>
    </div>
  );
}

describe("ThemeProvider", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    document.documentElement.classList.remove("light", "dark");
    window.matchMedia = createMatchMedia(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("provides default system theme", () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId("theme")).toHaveTextContent("system");
  });

  it("resolves system theme to light when prefers-color-scheme is light", async () => {
    window.matchMedia = createMatchMedia(false);

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("resolved-theme")).toHaveTextContent("light");
    });
  });

  it("resolves system theme to dark when prefers-color-scheme is dark", async () => {
    window.matchMedia = createMatchMedia(true);

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("resolved-theme")).toHaveTextContent("dark");
    });
  });

  it("allows setting theme to light", async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByTestId("set-light"));

    await waitFor(() => {
      expect(screen.getByTestId("theme")).toHaveTextContent("light");
      expect(screen.getByTestId("resolved-theme")).toHaveTextContent("light");
    });
  });

  it("allows setting theme to dark", async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByTestId("set-dark"));

    await waitFor(() => {
      expect(screen.getByTestId("theme")).toHaveTextContent("dark");
      expect(screen.getByTestId("resolved-theme")).toHaveTextContent("dark");
    });
  });

  it("persists theme to localStorage", async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByTestId("set-dark"));

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "arc-theme",
        "dark"
      );
    });
  });

  it("loads theme from localStorage on mount", () => {
    localStorageMock.getItem.mockReturnValue("dark");

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Initial render may show system, but stored theme is loaded
    expect(localStorageMock.getItem).toHaveBeenCalledWith("arc-theme");
  });

  it("applies theme class to document root", async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByTestId("set-dark"));

    await waitFor(() => {
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });
  });

  it("removes previous theme class when switching", async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Set to dark first
    fireEvent.click(screen.getByTestId("set-dark"));
    await waitFor(() => {
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });

    // Then switch to light
    fireEvent.click(screen.getByTestId("set-light"));
    await waitFor(() => {
      expect(document.documentElement.classList.contains("light")).toBe(true);
      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });
  });

  it("throws error when useTheme is used outside ThemeProvider", () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow("useTheme must be used within ThemeProvider");

    consoleSpy.mockRestore();
  });
});

describe("Theme persistence", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    document.documentElement.classList.remove("light", "dark");
    window.matchMedia = createMatchMedia(false);
  });

  it("ignores invalid stored theme values", () => {
    localStorageMock.getItem.mockReturnValue("invalid-theme");

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Should fall back to system
    expect(screen.getByTestId("theme")).toHaveTextContent("system");
  });

  it("handles empty localStorage gracefully", () => {
    localStorageMock.getItem.mockReturnValue(null);

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Should default to system
    expect(screen.getByTestId("theme")).toHaveTextContent("system");
  });
});
