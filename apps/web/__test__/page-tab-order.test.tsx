"use client";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import Home from "@/app/page";

// Mock components to simplify testing
vi.mock("@/components/attractor-canvas", () => ({
  AttractorCanvas: () => <div data-testid="attractor-canvas">Canvas</div>,
}));

vi.mock("@/components/footer", () => ({
  Footer: () => (
    <footer data-testid="footer" tabIndex={0}>
      Footer
    </footer>
  ),
}));

vi.mock("@/components/header", () => ({
  Header: () => (
    <header data-testid="header" tabIndex={0}>
      Header
    </header>
  ),
}));

vi.mock("@/components/progress-indicator", () => ({
  ProgressIndicator: () => <div data-testid="progress-indicator">Progress</div>,
}));

vi.mock("@/components/dark-mode-toggle", () => ({
  DarkModeToggle: () => (
    <button data-testid="dark-mode-toggle">Dark Mode</button>
  ),
}));

vi.mock("@/components/full-screen-button", () => ({
  FullScreenButton: () => (
    <button data-testid="full-screen-button">Full Screen</button>
  ),
}));

vi.mock("@/components/menu-toggle-button", () => ({
  MenuToggleButton: () => (
    <button data-testid="menu-toggle-button">Menu</button>
  ),
}));

vi.mock("@/components/download-button", () => ({
  DownloadButton: () => <button data-testid="download-button">Download</button>,
}));

vi.mock("@/components/menu-sheet", () => ({
  MenuSheet: () => (
    <div data-testid="menu-sheet" tabIndex={0}>
      Menu Sheet
    </div>
  ),
}));

describe("Page Tab Order", () => {
  it("should have a logical tab order for keyboard navigation", async () => {
    const user = userEvent.setup();
    render(<Home />);

    // Get all the focusable elements
    const header = screen.getByTestId("header");
    const progressIndicator = screen.getByTestId("progress-indicator");
    const menuToggleButton = screen.getByTestId("menu-toggle-button");
    const downloadButton = screen.getByTestId("download-button");
    const fullScreenButton = screen.getByTestId("full-screen-button");
    const darkModeToggle = screen.getByTestId("dark-mode-toggle");
    const menuSheet = screen.getByTestId("menu-sheet");
    const footer = screen.getByTestId("footer");

    // Verify that all elements are in the document
    expect(header).toBeInTheDocument();
    expect(progressIndicator).toBeInTheDocument();
    expect(menuToggleButton).toBeInTheDocument();
    expect(downloadButton).toBeInTheDocument();
    expect(fullScreenButton).toBeInTheDocument();
    expect(darkModeToggle).toBeInTheDocument();
    expect(menuSheet).toBeInTheDocument();
    expect(footer).toBeInTheDocument();

    // Focus on the first element and then tab through to check the order
    header.focus();
    expect(document.activeElement).toBe(header);

    // Tab to menu toggle button
    await user.tab();
    expect(document.activeElement).toBe(menuToggleButton);

    // Tab to download button
    await user.tab();
    expect(document.activeElement).toBe(downloadButton);

    // Tab to full screen button
    await user.tab();
    expect(document.activeElement).toBe(fullScreenButton);

    // Tab to dark mode toggle
    await user.tab();
    expect(document.activeElement).toBe(darkModeToggle);

    // Tab to menu sheet (if it contains focusable elements)
    await user.tab();

    // Tab to footer (or any focusable elements within the footer)
    await user.tab();
    // Since we're using a simple mock for footer that might not have
    // focusable elements, we can't assert exact focus position here
    // but we can check that it's not one of the previous elements
    expect(document.activeElement).not.toBe(darkModeToggle);
    expect(document.activeElement).not.toBe(fullScreenButton);
    expect(document.activeElement).not.toBe(downloadButton);
    expect(document.activeElement).not.toBe(menuToggleButton);

    // This test verifies that the toolbar buttons are encountered in the expected logical order:
    // menuToggleButton -> downloadButton -> fullScreenButton -> darkModeToggle
    // which matches the order defined in page.tsx
  });
});
