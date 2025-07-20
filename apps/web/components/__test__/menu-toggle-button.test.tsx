import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { MenuToggleButton } from "../menu-toggle-button";
import { itHasNoA11yViolations } from "@/lib/test-utils/a11y-test-helpers";

// Mock the UI store
const mockMenuOpen = vi.fn();
const mockSetMenuOpen = vi.fn();
const mockMenuPosition = vi.fn();

vi.mock("@/store/ui-store", () => ({
  useUIStore: (selector: any) =>
    selector({
      menuOpen: mockMenuOpen(),
      setMenuOpen: mockSetMenuOpen,
      menuPosition: mockMenuPosition(),
    }),
}));

describe("MenuToggleButton", () => {
  const user = userEvent.setup();

  // Accessibility test
  itHasNoA11yViolations(() => {
    mockMenuOpen.mockReturnValue(false);
    mockMenuPosition.mockReturnValue("right");
    return render(<MenuToggleButton />);
  });

  beforeEach(() => {
    vi.clearAllMocks();

    // Default values
    mockMenuOpen.mockReturnValue(false);
    mockMenuPosition.mockReturnValue("right");

    // Mock window.matchMedia for device detection
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
  });

  describe("Conditional Rendering", () => {
    it("is hidden with CSS when menu is open", () => {
      mockMenuOpen.mockReturnValue(true);
      render(<MenuToggleButton />);
      const button = screen.getByRole("button", { name: "Close menu" });
      expect(button.className).toContain("hidden");
    });

    it("renders when menu is closed", () => {
      mockMenuOpen.mockReturnValue(false);
      render(<MenuToggleButton />);
      expect(
        screen.getByRole("button", { name: "Open menu" }),
      ).toBeInTheDocument();
    });

    it("renders on the left when menuPosition is left", () => {
      mockMenuPosition.mockReturnValue("left");
      render(<MenuToggleButton />);
      const button = screen.getByRole("button", { name: "Open menu" });
      expect(button.className).toContain("left-6");
    });

    it("renders on the right when menuPosition is right", () => {
      mockMenuPosition.mockReturnValue("right");
      render(<MenuToggleButton />);
      const button = screen.getByRole("button", { name: "Open menu" });
      expect(button.className).toContain("right-6");
    });
  });

  describe("Menu Toggling", () => {
    it("toggles menu state on click when menu is closed", () => {
      mockMenuOpen.mockReturnValue(false);
      render(<MenuToggleButton />);

      const button = screen.getByRole("button", { name: "Open menu" });
      fireEvent.click(button);

      expect(mockSetMenuOpen).toHaveBeenCalledWith(true);
    });

    it("toggles menu state on click when menu is open", () => {
      mockMenuOpen.mockReturnValue(true);
      render(<MenuToggleButton />);

      // Even though the button is hidden with CSS, we can still query it for testing purposes
      const button = screen.getByRole("button", { name: "Close menu" });
      fireEvent.click(button);

      expect(mockSetMenuOpen).toHaveBeenCalledWith(false);
    });

    it("has correct aria-expanded attribute when menu is closed", () => {
      mockMenuOpen.mockReturnValue(false);
      render(<MenuToggleButton />);

      const button = screen.getByRole("button", { name: "Open menu" });
      expect(button).toHaveAttribute("aria-expanded", "false");
    });

    it("has correct aria-expanded attribute when menu is open", () => {
      mockMenuOpen.mockReturnValue(true);
      render(<MenuToggleButton />);

      const button = screen.getByRole("button", { name: "Close menu" });
      expect(button).toHaveAttribute("aria-expanded", "true");
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

      render(<MenuToggleButton />);
      const button = screen.getByRole("button", { name: "Open menu" });
      expect(button.className).toContain("scale-75");
    });

    it("applies correct scale class for non-touch devices", () => {
      render(<MenuToggleButton />);
      const button = screen.getByRole("button", { name: "Open menu" });
      expect(button.className).toContain("scale-60");
    });
  });

  describe("Touch Event Handling", () => {
    it("changes scale on touch events", () => {
      render(<MenuToggleButton />);
      const button = screen.getByRole("button", { name: "Open menu" });

      // Simulate touch events
      fireEvent.touchStart(button);
      expect(button.className).toContain("scale-60");

      fireEvent.touchEnd(button);
      expect(button.className).toContain("scale-75");
    });
  });

  describe("Accessibility", () => {
    it("has correct ARIA attributes when menu is closed", () => {
      mockMenuOpen.mockReturnValue(false);
      render(<MenuToggleButton />);
      const button = screen.getByRole("button", { name: "Open menu" });
      expect(button).toHaveAttribute("aria-label", "Open menu");
    });

    it("has correct ARIA attributes when menu is open", () => {
      mockMenuOpen.mockReturnValue(true);
      render(<MenuToggleButton />);
      const button = screen.getByRole("button", { name: "Close menu" });
      expect(button).toHaveAttribute("aria-label", "Close menu");
    });

    it("has sr-only text", () => {
      render(<MenuToggleButton />);
      expect(screen.getByText("Toggle menu")).toBeInTheDocument();
      expect(screen.getByText("Toggle menu").className).toContain("sr-only");
    });

    it("has focus-visible ring styles", async () => {
      render(<MenuToggleButton />);
      const button = screen.getByRole("button", { name: "Open menu" });

      // Check that button has expected focus-related classes
      expect(button.className).toContain("outline-none");
      expect(button.className).toContain("focus-visible:ring-[6px]");
      expect(button.className).toContain("focus-visible:ring-yellow-400");

      // Focus the button using keyboard navigation
      await user.tab();
      expect(button).toHaveFocus();

      // Check that the button is visible when focused
      expect(button).toBeVisible();
    });
  });
});
