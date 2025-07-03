import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DarkModeToggle } from "../components/dark-mode-toggle";
import { vi, describe, it, expect, beforeEach } from "vitest";
import React from "react";

// Mock the useTheme hook from next-themes
const mockSetTheme = vi.fn();
const mockUseTheme = vi.fn();

vi.mock("next-themes", () => ({
  useTheme: () => mockUseTheme(),
}));

describe("DarkModeToggle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers(); // Enable fake timers
    // Default mock implementation for useTheme
    mockUseTheme.mockReturnValue({
      theme: "light",
      setTheme: mockSetTheme,
    });
  });

  afterEach(() => {
    vi.useRealTimers(); // Restore real timers
  });

  // Test Case 1: Basic Rendering
  describe("Basic Rendering", () => {
    it("renders the Moon icon when theme is light", () => {
      mockUseTheme.mockReturnValue({
        theme: "light",
        setTheme: mockSetTheme,
      });
      render(<DarkModeToggle />);
      // Advance timers to trigger useEffect
      vi.advanceTimersByTime(0); 
      expect(screen.getByLabelText("Toggle dark mode")).toBeInTheDocument();
      expect(screen.getByTestId("moon-icon")).toBeInTheDocument();
      expect(screen.queryByTestId("sun-icon")).not.toBeInTheDocument();
    });

    it("renders the Sun icon when theme is dark", () => {
      mockUseTheme.mockReturnValue({
        theme: "dark",
        setTheme: mockSetTheme,
      });
      render(<DarkModeToggle />);
      // Advance timers to trigger useEffect
      vi.advanceTimersByTime(0); 
      expect(screen.getByLabelText("Toggle dark mode")).toBeInTheDocument();
      expect(screen.getByTestId("sun-icon")).toBeInTheDocument();
      expect(screen.queryByTestId("moon-icon")).not.toBeInTheDocument();
    });
  });

  // Test Case 2: Theme Toggling
  describe("Theme Toggling", () => {
    it("switches to dark mode when current theme is light", () => {
      mockUseTheme.mockReturnValue({
        theme: "light",
        setTheme: mockSetTheme,
      });
      render(<DarkModeToggle />);
      vi.advanceTimersByTime(0); 

      const toggleButton = screen.getByLabelText("Toggle dark mode");
      fireEvent.click(toggleButton);

      expect(mockSetTheme).toHaveBeenCalledWith("dark");
    });

    it("switches to light mode when current theme is dark", () => {
      mockUseTheme.mockReturnValue({
        theme: "dark",
        setTheme: mockSetTheme,
      });
      render(<DarkModeToggle />);
      vi.advanceTimersByTime(0); 

      const toggleButton = screen.getByLabelText("Toggle dark mode");
      fireEvent.click(toggleButton);

      expect(mockSetTheme).toHaveBeenCalledWith("light");
    });
  });

  

  // Test Case 4: Accessibility
  describe("Accessibility", () => {
    it("has correct aria-label on the button", () => {
      mockUseTheme.mockReturnValue({
        theme: "light",
        setTheme: mockSetTheme,
      });
      render(<DarkModeToggle />);
      vi.advanceTimersByTime(0); 
      expect(screen.getByRole("button", { name: "Toggle dark mode" })).toBeInTheDocument();
    });

    it("has sr-only span for screen readers", () => {
      mockUseTheme.mockReturnValue({
        theme: "light",
        setTheme: mockSetTheme,
      });
      render(<DarkModeToggle />);
      vi.advanceTimersByTime(0); 
      expect(screen.getByText("Toggle dark mode", { selector: "span.sr-only" })).toBeInTheDocument();
    });
  });
});

// Add data-testid to the icons in the component for easier selection
// This is a temporary change for testing purposes, ideally icons would have accessible names
// or be selected via their parent button's accessible name.
// For now, we'll add data-testid to the component directly.
// This would be done in apps/web/components/dark-mode-toggle.tsx
// <Sun className="h-5 w-5" data-testid="sun-icon" />
// <Moon className="h-5 w-5" data-testid="moon-icon" />
