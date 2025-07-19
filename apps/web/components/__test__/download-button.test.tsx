import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { DownloadButton } from "../download-button";
import React from "react";

// Create a container for rendering
let container: HTMLDivElement;

// Mock the Button component from UI
vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    className,
    "aria-label": ariaLabel,
    "aria-disabled": ariaDisabled,
    type,
    disabled,
  }: any) => {
    // Explicitly render to the document
    return (
      <button
        onClick={onClick}
        className={className}
        aria-label={ariaLabel}
        aria-disabled={ariaDisabled}
        type={type}
        disabled={disabled}
        data-testid="button-mock"
      >
        {children}
      </button>
    );
  },
}));

// Mock the cn utility function
vi.mock("@/lib/utils", () => ({
  cn: (...inputs: any[]) => inputs.filter(Boolean).join(" "),
}));

// Mock the CSS module
vi.mock("../download-button.module.css", () => ({
  default: {
    downloadButton: "downloadButtonClass",
  },
}));

// Mock the UI store
const mockImageUrl = vi.fn();
const mockMenuOpen = vi.fn();

vi.mock("@/store/ui-store", () => ({
  useUIStore: (selector: any) =>
    selector({
      imageUrl: mockImageUrl(),
      menuOpen: mockMenuOpen(),
    }),
}));

describe("DownloadButton", () => {
  const user = userEvent.setup();

  // Mock document.createElement for download functionality
  const mockAnchor = {
    href: "",
    download: "",
    click: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Create a container element
    container = document.createElement("div");
    document.body.appendChild(container);

    // Default values
    mockMenuOpen.mockReturnValue(false);
    mockImageUrl.mockReturnValue("test-image-url.png");

    // Save the original createElement method
    const originalCreateElement = document.createElement;

    // Mock document.createElement
    document.createElement = vi.fn().mockImplementation((tag) => {
      if (tag === "a") return mockAnchor as any;
      // For other tags, call the original method
      return originalCreateElement.call(document, tag);
    });

    // Store original methods before mocking
    const originalAppendChild = document.body.appendChild;
    const originalRemoveChild = document.body.removeChild;

    // Mock document.body methods but still call original
    document.body.appendChild = vi.fn().mockImplementation((element) => {
      if (element !== mockAnchor) {
        return originalAppendChild.call(document.body, element);
      }
      return element;
    });

    document.body.removeChild = vi.fn().mockImplementation((element) => {
      if (element !== mockAnchor) {
        return originalRemoveChild.call(document.body, element);
      }
    });

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

    // Mock Date.now() for predictable filenames
    const originalDateNow = Date.now;
    Date.now = vi.fn(() => 1234567890);

    // Return cleanup function
    return () => {
      Date.now = originalDateNow;
    };
  });

  afterEach(() => {
    // Clean up the container
    document.body.removeChild(container);
  });

  describe("Conditional Rendering", () => {
    it("does not render when menu is open", () => {
      mockMenuOpen.mockReturnValue(true);
      mockImageUrl.mockReturnValue("test-image-url.png");
      render(<DownloadButton />, { container });
      expect(
        screen.queryByRole("button", { name: "Download attractor image" }),
      ).not.toBeInTheDocument();
    });

    it("does not render when there is no image URL", () => {
      mockMenuOpen.mockReturnValue(false);
      mockImageUrl.mockReturnValue("");
      render(<DownloadButton />, { container });

      const button = screen.queryByRole("button", {
        name: "Download attractor image",
      });
      expect(button).not.toBeInTheDocument();
    });

    it("renders when menu is closed and image URL is available", () => {
      mockMenuOpen.mockReturnValue(false);
      mockImageUrl.mockReturnValue("test-image-url.png");
      const { container: renderContainer } = render(<DownloadButton />, {
        container,
      });
      // First try to find by test ID as a fallback
      const button =
        renderContainer.querySelector('[data-testid="button-mock"]') ||
        screen.queryByRole("button", { name: "Download attractor image" });
      expect(button).toBeInTheDocument();
    });
  });

  describe("Download Functionality", () => {
    it("initiates download when clicked", () => {
      mockMenuOpen.mockReturnValue(false);
      mockImageUrl.mockReturnValue("test-image-url.png");
      render(<DownloadButton />, { container });

      const button = screen.getByRole("button", {
        name: "Download attractor image",
      });
      fireEvent.click(button);

      expect(mockAnchor.href).toBe("test-image-url.png");
      expect(mockAnchor.download).toBe("attractor-1234567890.png");
      expect(mockAnchor.click).toHaveBeenCalled();
      expect(document.body.appendChild).toHaveBeenCalled();
      expect(document.body.removeChild).toHaveBeenCalled();
    });

    it("does not download when image URL is empty", () => {
      mockMenuOpen.mockReturnValue(false);
      mockImageUrl.mockReturnValue("");
      render(<DownloadButton />, { container });

      // Button shouldn't render, so we can't click it
      expect(document.createElement).not.toHaveBeenCalledWith("a");
      expect(mockAnchor.click).not.toHaveBeenCalled();
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

      render(<DownloadButton />, { container });
      const button = screen.getByRole("button", {
        name: "Download attractor image",
      });
      expect(button.className).toContain("scale-75");
    });

    it("applies correct scale class for non-touch devices", () => {
      render(<DownloadButton />, { container });
      const button = screen.getByRole("button", {
        name: "Download attractor image",
      });
      expect(button.className).toContain("scale-60");
    });
  });

  describe("Accessibility", () => {
    it("has correct ARIA attributes", () => {
      render(<DownloadButton />, { container });
      const button = screen.getByRole("button", {
        name: "Download attractor image",
      });
      expect(button).toHaveAttribute("aria-label", "Download attractor image");
    });

    it("has visible text label", () => {
      render(<DownloadButton />, { container });
      expect(screen.getByText("Download")).toBeInTheDocument();
    });

    it("has focus-visible ring styles", async () => {
      render(<DownloadButton />, { container });
      const button = screen.getByRole("button", {
        name: "Download attractor image",
      });

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

    // Test removed: The aria-disabled test is no longer needed since
    // the button is not rendered at all when no image URL is available
  });
});
