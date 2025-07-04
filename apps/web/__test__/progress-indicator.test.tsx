import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { ProgressIndicator } from "../components/progress-indicator";

// Mock useUIStore
const mockProgress = vi.fn();
vi.mock("../store/ui-store", () => ({
  useUIStore: (selector: any) => selector({ progress: mockProgress() }),
}));

describe("ProgressIndicator", () => {
  describe("Basic Rendering", () => {
    it("renders the main container and progress bar", () => {
      mockProgress.mockReturnValue(0);
      render(<ProgressIndicator />);
      
      // Main container should be present with correct styles
      const container = screen.getByRole("progressbar");
      expect(container).toHaveClass(
        "fixed", 
        "top-0", 
        "left-0", 
        "right-0", 
        "w-screen",
        "h-[2px]"
      );

      // Progress bar value and attributes should be correct
      expect(container).toHaveAttribute("aria-valuenow", "0");
      expect(container).toHaveAttribute("aria-valuemin", "0");
      expect(container).toHaveAttribute("aria-valuemax", "100");

      // Progress bar indicator should have correct width
      const progressBar = container.firstElementChild;
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveStyle({ width: "0%" });
    });

    it("renders with default progress from store", () => {
      mockProgress.mockReturnValue(30);
      render(<ProgressIndicator />);
      
      const container = screen.getByRole("progressbar");
      expect(container).toHaveAttribute("aria-valuenow", "30");
      
      const progressBar = container.firstElementChild;
      expect(progressBar).toHaveStyle({ width: "30%" });
    });
  });

  describe("Progress Updates", () => {
    it.each([
      [0, "0%"],
      [25, "25%"],
      [50, "50%"],
      [75, "75%"],
      [100, "100%"]
    ])("updates progress bar width to %i%", (progress, expectedWidth) => {
      mockProgress.mockReturnValue(progress);
      render(<ProgressIndicator />);
      
      const container = screen.getByRole("progressbar");
      expect(container).toHaveAttribute("aria-valuenow", progress.toString());
      
      const progressBar = container.firstElementChild;
      expect(progressBar).toHaveStyle({ width: expectedWidth });
    });

    it("rounds fractional progress values", () => {
      mockProgress.mockReturnValue(33.3333);
      render(<ProgressIndicator />);
      
      const container = screen.getByRole("progressbar");
      expect(container).toHaveAttribute("aria-valuenow", "33");
      
      const progressBar = container.firstElementChild;
      expect(progressBar).toHaveStyle({ width: "33%" });
    });
  });

  describe("Visual Attributes", () => {
    it("has correct visual styling classes", () => {
      mockProgress.mockReturnValue(50);
      render(<ProgressIndicator />);
      
      // Main container styling
      const container = screen.getByRole("progressbar");
      expect(container).toHaveClass(
        "fixed",
        "top-0",
        "left-0",
        "right-0",
        "w-screen",
        "bg-[rgba(255,255,255,0)]",
        "text-[#222]",
        "z-[101]",
        "h-[2px]",
        "p-0",
        "m-0",
        "shadow-none",
        "flex",
        "items-stretch"
      );
      
      // Verify ARIA attributes
      expect(container).toHaveAttribute("aria-valuenow", "50");
      expect(container).toHaveAttribute("aria-valuemin", "0");
      expect(container).toHaveAttribute("aria-valuemax", "100");

      // Progress bar styling
      const progressBar = container.firstElementChild;
      expect(progressBar).toHaveClass(
        "h-full",
        "transition-[width]",
        "duration-200",
        "rounded-none",
        "bg-gradient-to-r",
        "from-[#4f8cff]",
        "to-[#00e0c6]"
      );
    });
  });
});
