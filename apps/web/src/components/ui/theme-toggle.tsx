"use client";

import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/**
 * ThemeToggle Component
 *
 * A dropdown menu for switching between light, dark, and system themes.
 * Uses the ThemeProvider context for state management.
 */

export interface ThemeToggleProps {
  /** Size of the toggle button */
  size?: "sm" | "default" | "lg";
  /** Show label text alongside icon */
  showLabel?: boolean;
  /** Align dropdown menu */
  align?: "start" | "center" | "end";
  /** Additional class names */
  className?: string;
}

export function ThemeToggle({
  size = "default",
  showLabel = false,
  align = "end",
  className,
}: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const buttonSizes = {
    sm: "h-8 w-8",
    default: "h-9 w-9",
    lg: "h-10 w-10",
  };

  const iconSizes = {
    sm: "h-4 w-4",
    default: "h-[1.2rem] w-[1.2rem]",
    lg: "h-5 w-5",
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            buttonSizes[size],
            showLabel && "w-auto px-3 gap-2",
            className
          )}
        >
          <Sun
            className={cn(
              iconSizes[size],
              "rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
            )}
          />
          <Moon
            className={cn(
              iconSizes[size],
              "absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
            )}
          />
          {showLabel && (
            <span className="capitalize">
              {theme === "system" ? resolvedTheme : theme}
            </span>
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align}>
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className={cn(theme === "light" && "bg-accent")}
        >
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className={cn(theme === "dark" && "bg-accent")}
        >
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className={cn(theme === "system" && "bg-accent")}
        >
          <Monitor className="mr-2 h-4 w-4" />
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

ThemeToggle.displayName = "ThemeToggle";

/**
 * SimpleThemeToggle Component
 *
 * A simple button that toggles between light and dark modes
 * without a dropdown menu.
 */
export interface SimpleThemeToggleProps {
  /** Size of the toggle button */
  size?: "sm" | "default" | "lg";
  /** Additional class names */
  className?: string;
}

export function SimpleThemeToggle({
  size = "default",
  className,
}: SimpleThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();

  const buttonSizes = {
    sm: "h-8 w-8",
    default: "h-9 w-9",
    lg: "h-10 w-10",
  };

  const iconSizes = {
    sm: "h-4 w-4",
    default: "h-[1.2rem] w-[1.2rem]",
    lg: "h-5 w-5",
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={cn(buttonSizes[size], className)}
    >
      <Sun
        className={cn(
          iconSizes[size],
          "rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
        )}
      />
      <Moon
        className={cn(
          iconSizes[size],
          "absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
        )}
      />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

SimpleThemeToggle.displayName = "SimpleThemeToggle";
