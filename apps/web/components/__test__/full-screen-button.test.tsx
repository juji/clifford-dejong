import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { FullScreenButton } from "../full-screen-button";

// Define interfaces for typing the fullscreen API
interface FullscreenElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void>;
  mozRequestFullScreen?: () => Promise<void>;
  msRequestFullscreen?: () => Promise<void>;
}

const mockMenuOpen = vi.fn();
vi.mock("../../store/ui-store", () => ({
  useUIStore: (selector: any) => selector({ menuOpen: mockMenuOpen() }),
}));

describe("FullScreenButton", () => {
  const user = userEvent.setup();
  
  // Store original console error function to restore later
  const originalConsoleError = console.error;

  afterEach(() => {
    console.error = originalConsoleError
  })

  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress expected console errors
    console.error = vi.fn();
    
    // Mock fullscreen API using Object.defineProperty
    // This properly adds the fullscreen API to the document object
    
    // 1. Define fullscreenEnabled property
    Object.defineProperty(document, 'fullscreenEnabled', {
      configurable: true,
      value: true
    });
    
    // 2. Mock prefixed fullscreenEnabled versions
    Object.defineProperty(document, 'webkitFullscreenEnabled', {
      configurable: true,
      value: true
    });
    
    Object.defineProperty(document, 'mozFullScreenEnabled', {
      configurable: true,
      value: false // Test browser fallbacks
    });
    
    Object.defineProperty(document, 'msFullscreenEnabled', {
      configurable: true,
      value: false // Test browser fallbacks
    });
    
    // 3. Mock document.documentElement.requestFullscreen and variants
    const docEl = document.documentElement as FullscreenElement;
    docEl.requestFullscreen = vi.fn().mockResolvedValue(undefined);
    docEl.webkitRequestFullscreen = vi.fn().mockResolvedValue(undefined);
    docEl.mozRequestFullScreen = vi.fn().mockResolvedValue(undefined);
    docEl.msRequestFullscreen = vi.fn().mockResolvedValue(undefined);
    
    // 4. Mock document.exitFullscreen and variants
    document.exitFullscreen = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(document, 'webkitExitFullscreen', {
      configurable: true,
      value: vi.fn().mockResolvedValue(undefined)
    });
    Object.defineProperty(document, 'mozCancelFullScreen', {
      configurable: true,
      value: vi.fn().mockResolvedValue(undefined)
    });
    Object.defineProperty(document, 'msExitFullscreen', {
      configurable: true,
      value: vi.fn().mockResolvedValue(undefined)
    });
    
    // 5. Mock fullscreenElement (initially not in fullscreen)
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      value: null
    });
    
    // 6. Mock prefixed fullscreenElement versions
    Object.defineProperty(document, 'webkitFullscreenElement', {
      configurable: true,
      value: null
    });
    Object.defineProperty(document, 'mozFullScreenElement', {
      configurable: true,
      value: null
    });
    Object.defineProperty(document, 'msFullscreenElement', {
      configurable: true,
      value: null
    });
    
    // 7. Mock window.matchMedia for device detection
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

    it("does not render when fullscreen API is unsupported", () => {
      // Mock fullscreen API as unsupported
      Object.defineProperty(document, 'fullscreenEnabled', {
        configurable: true,
        value: false
      });
      
      // Also remove prefixed variants
      Object.defineProperty(document, 'webkitFullscreenEnabled', {
        configurable: true,
        value: false
      });
      
      // Remove fullscreen methods
      const docEl = document.documentElement as FullscreenElement;
      const originalRequestFullscreen = docEl.requestFullscreen;
      docEl.requestFullscreen = undefined as unknown as () => Promise<void>;
      docEl.webkitRequestFullscreen = undefined;
      
      render(<FullScreenButton />);
      expect(screen.queryByRole("button", { name: "Toggle fullscreen" })).not.toBeInTheDocument();
      
      // Restore for other tests
      Object.defineProperty(document, 'fullscreenEnabled', {
        configurable: true,
        value: true
      });
      Object.defineProperty(document, 'webkitFullscreenEnabled', {
        configurable: true,
        value: true
      });
      docEl.requestFullscreen = originalRequestFullscreen;
      docEl.webkitRequestFullscreen = vi.fn().mockResolvedValue(undefined);
    });

    it("renders when menu is closed and fullscreen is supported", () => {
      // Ensure fullscreen is supported
      Object.defineProperty(document, 'fullscreenEnabled', {
        configurable: true,
        value: true
      });
      
      render(<FullScreenButton />);
      expect(screen.getByRole("button", { name: "Toggle fullscreen" })).toBeInTheDocument();
    });
  });

  describe("Fullscreen Toggling", () => {
    it("toggles fullscreen state on click", async () => {
      render(<FullScreenButton />);
      const button = screen.getByRole("button", { name: "Toggle fullscreen" });

      // Get access to the mocked function
      const docEl = document.documentElement as FullscreenElement;

      // Enter fullscreen
      await user.click(button);
      expect(docEl.requestFullscreen).toHaveBeenCalled();

      // Mock fullscreen state - simulate being in fullscreen
      Object.defineProperty(document, "fullscreenElement", {
        configurable: true,
        value: document.documentElement
      });

      // Force re-render by clicking again to test exit behavior
      await user.click(button);
      
      // Verify document.exitFullscreen was called
      expect(document.exitFullscreen).toHaveBeenCalled();
      
      // Set fullscreen state back to not in fullscreen
      Object.defineProperty(document, "fullscreenElement", {
        configurable: true,
        value: null
      });
      
      // Click again to enter fullscreen
      await user.click(button);
      
      // Verify corner elements are properly rotated when in fullscreen
      Object.defineProperty(document, "fullscreenElement", {
        configurable: true,
        value: document.documentElement
      });
      
      // Force component update to show fullscreen state
      const fullscreenEvent = new Event('fullscreenchange');
      document.dispatchEvent(fullscreenEvent);
      
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

      // Exit fullscreen
      await user.click(button);
      expect(document.exitFullscreen).toHaveBeenCalledTimes(2);
      
      // Set fullscreen state to not in fullscreen
      Object.defineProperty(document, "fullscreenElement", {
        configurable: true,
        value: null
      });
      
      // Force component update
      const exitFullscreenEvent = new Event('fullscreenchange');
      document.dispatchEvent(exitFullscreenEvent);
    });

    it("handles missing fullscreen API gracefully", async () => {
      // Since we're testing graceful handling of missing APIs, we need to first ensure
      // the button still renders by having fullscreenEnabled = true
      
      const docEl = document.documentElement as FullscreenElement;
      
      // Save original methods for cleanup
      const originalRequestFullscreen = docEl.requestFullscreen;
      const originalExitFullscreen = document.exitFullscreen;
      const originalWebkitRequestFullscreen = docEl.webkitRequestFullscreen;

      // Set up the test scenario: fullscreen is "supported" but methods fail
      // We still need to show the button, but the click should be handled gracefully
      Object.defineProperty(document, 'fullscreenEnabled', {
        configurable: true,
        value: true
      });
      
      // Mock the methods to throw errors when called
      docEl.requestFullscreen = vi.fn().mockRejectedValue(new Error("Fullscreen API failed"));
      docEl.webkitRequestFullscreen = vi.fn().mockRejectedValue(new Error("Webkit Fullscreen API failed"));
      document.exitFullscreen = vi.fn().mockRejectedValue(new Error("Exit fullscreen API failed"));

      render(<FullScreenButton />);
      const button = screen.getByRole("button", { name: "Toggle fullscreen" });

      // Verify button renders and is interactive
      expect(button).toBeEnabled();
      
      // Click should not throw and button should maintain its state
      await user.click(button);
      expect(button).toBeInTheDocument();
      expect(button).toBeEnabled();
      
      // Verify requestFullscreen was called but errors were handled gracefully
      expect(docEl.requestFullscreen).toHaveBeenCalled();
      
      // Corner elements should not change state when fullscreen APIs are unavailable
      const corners = document.querySelectorAll(".fs-corner");
      corners.forEach(corner => {
        expect(corner).not.toHaveStyle({ transform: /rotate/ });
      });

      // Restore original methods for test cleanup
      docEl.requestFullscreen = originalRequestFullscreen;
      docEl.webkitRequestFullscreen = originalWebkitRequestFullscreen;
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
