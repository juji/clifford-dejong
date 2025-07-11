import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { FullScreenButton } from "../full-screen-button";

// Mock useUIStore
const mockMenuOpen = vi.fn();
vi.mock("../../store/ui-store", () => ({
  useUIStore: (selector: any) => selector({ menuOpen: mockMenuOpen() }),
}));

describe("FullScreenButton", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock window.navigator.userAgent
    const mockUserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)";
    Object.defineProperty(window.navigator, "userAgent", {
      get: () => mockUserAgent,
      configurable: true,
    });

    // Mock document.documentElement.requestFullscreen
    document.documentElement.requestFullscreen = vi.fn();

    // Mock document.exitFullscreen
    document.exitFullscreen = vi.fn();

    // Mock document.fullscreenElement
    Object.defineProperty(document, "fullscreenElement", {
      value: null,
      writable: true,
    });

    // Mock window.matchMedia
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    // Default menu closed state
    mockMenuOpen.mockReturnValue(false);
  });

  describe("Conditional Rendering", () => {
    it("does not render when menu is open", () => {
      mockMenuOpen.mockReturnValue(true);
      render(<FullScreenButton />);
      expect(screen.queryByRole("button", { name: "Toggle fullscreen" })).not.toBeInTheDocument();
    });

    it("does not render on iOS devices", () => {
      // Mock iOS user agent
      Object.defineProperty(window.navigator, "userAgent", {
        get: () => "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)",
        configurable: true,
      });
      render(<FullScreenButton />);
      expect(screen.queryByRole("button", { name: "Toggle fullscreen" })).not.toBeInTheDocument();
    });

    it("renders when menu is closed and not on iOS", () => {
      render(<FullScreenButton />);
      expect(screen.getByRole("button", { name: "Toggle fullscreen" })).toBeInTheDocument();
    });
  });

  describe("Fullscreen Toggling", () => {
    it("toggles fullscreen state on click", async () => {
      render(<FullScreenButton />);
      const button = screen.getByRole("button", { name: "Toggle fullscreen" });

      // Enter fullscreen
      await user.click(button);
      expect(document.documentElement.requestFullscreen).toHaveBeenCalled();

      // Mock fullscreen state
      Object.defineProperty(document, "fullscreenElement", {
        value: document.documentElement,
        writable: true,
      });

      // Verify corner elements are rotated
      const corners = document.querySelectorAll(".fs-corner");
      expect(corners.length).toBe(4);
      
      // Define corner configurations for clearer test intentions
      const cornerConfigs = {
        topLeft: { position: "top-left", rotation: 180 },
        topRight: { position: "top-right", rotation: -180 },
        bottomLeft: { position: "bottom-left", rotation: -180 },
        bottomRight: { position: "bottom-right", rotation: 180 }
      } as const;

      // Verify we have the expected number of corners
      const cornerElements = Array.from(corners);
      expect(cornerElements.length).toBe(Object.keys(cornerConfigs).length);

      // Test each corner's rotation
      Object.values(cornerConfigs).forEach((config, i) => {
        expect(cornerElements[i], `${config.position} corner`).toHaveStyle({ 
          transform: `rotate(${config.rotation}deg)` 
        });
      });

      // Exit fullscreen
      await user.click(button);
      expect(document.exitFullscreen).toHaveBeenCalled();

      // Verify corner elements are not rotated
      Object.values(cornerConfigs).forEach((config, i) => {
        expect(cornerElements[i], `${config.position} corner`).not.toHaveStyle({ transform: /rotate/ });
      });
    });

    it("handles missing fullscreen API gracefully", async () => {
      // Save original methods for cleanup
      const originalRequestFullscreen = document.documentElement.requestFullscreen;
      const originalExitFullscreen = document.exitFullscreen;

      // Remove fullscreen methods to simulate older browsers
      document.documentElement.requestFullscreen = undefined as any;
      document.exitFullscreen = undefined as any;

      render(<FullScreenButton />);
      const button = screen.getByRole("button", { name: "Toggle fullscreen" });

      // Verify button renders and is interactive
      expect(button).toBeEnabled();
      
      // Click should not throw and button should maintain its state
      await user.click(button);
      expect(button).toBeInTheDocument();
      expect(button).toBeEnabled();
      
      // Corner elements should not change state when fullscreen APIs are unavailable
      const corners = document.querySelectorAll(".fs-corner");
      corners.forEach(corner => {
        expect(corner).not.toHaveStyle({ transform: /rotate/ });
      });

      // Restore original methods for test cleanup
      document.documentElement.requestFullscreen = originalRequestFullscreen;
      document.exitFullscreen = originalExitFullscreen;
    });
  });

  describe("Pointer Type Detection", () => {
    it("applies correct scale class for touch devices", () => {
      // Mock touch device
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query.includes("pointer: coarse"),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      render(<FullScreenButton />);
      const button = screen.getByRole("button", { name: "Toggle fullscreen" });
      expect(button.className).toContain("scale-75");
    });

    it("applies correct scale class for non-touch devices", () => {
      render(<FullScreenButton />);
      const button = screen.getByRole("button", { name: "Toggle fullscreen" });
      expect(button.className).toContain("scale-60");
    });
  });

  describe("Touch Event Handling", () => {
    it("changes scale on touch events", async () => {
      // Mock touch device
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query.includes("pointer: coarse"),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      render(<FullScreenButton />);
      const button = screen.getByRole("button", { name: "Toggle fullscreen" });

      // Simulate touch events
      fireEvent.touchStart(button);
      expect(button.className).toContain("scale-60");

      fireEvent.touchEnd(button);
      expect(button.className).toContain("scale-75");
    });
  });

  describe("Accessibility", () => {
    it("has correct ARIA attributes", () => {
      render(<FullScreenButton />);
      const button = screen.getByRole("button", { name: "Toggle fullscreen" });
      expect(button).toHaveAttribute("aria-label", "Toggle fullscreen");
    });

    it("has focus and hover states", async () => {
      render(<FullScreenButton />);
      const button = screen.getByRole("button", { name: "Toggle fullscreen" });

      expect(button.className).toContain("focus:outline-none");
      expect(button.className).toContain("focus:ring-2");
      expect(button.className).toContain("hover:scale-75");
      
      await user.tab();
      expect(button).toHaveFocus();
    });
  });
});
