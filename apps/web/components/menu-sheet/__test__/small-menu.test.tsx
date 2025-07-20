"use client";

import { render, screen } from "@testing-library/react";
import { SmallMenu } from "../small-menu";
import { useUIStore, type UITab } from "@/store/ui-store";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { itHasNoA11yViolations } from "@/lib/test-utils/a11y-test-helpers";

// Mock useUIStore
vi.mock("@/store/ui-store", () => ({
  useUIStore: vi.fn(),
}));

// Mock useAttractorStore
vi.mock("@repo/state/attractor-store", () => ({
  useAttractorStore: vi.fn().mockImplementation((selector) => {
    const store = {
      reset: vi.fn(),
    };
    return selector(store);
  }),
}));

// Mock the dialog components
vi.mock("@/components/config-selection-dialog", () => ({
  ConfigSelectionDialog: () => (
    <div data-testid="mock-load-dialog">Load Dialog</div>
  ),
}));

vi.mock("@/components/config-save-dialog", () => ({
  ConfigSaveDialog: () => <div data-testid="mock-save-dialog">Save Dialog</div>,
}));

// Mock SmallMenuSub component
vi.mock("../small-menu-sub", () => ({
  SmallMenuSub: ({
    tab,
    onTabClose,
  }: {
    tab: UITab;
    onTabClose: () => void;
  }) => (
    <div data-testid={`mock-submenu-${tab}`}>
      {tab} Menu
      <button data-testid="submenu-close" onClick={onTabClose}>
        Close Submenu
      </button>
    </div>
  ),
}));

describe("SmallMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Accessibility test
  itHasNoA11yViolations(() => {
    // Setup mocks for the test
    (useUIStore as any).mockImplementation((selector: any) => {
      const store = {
        menuOpen: true,
        setMenuOpen: vi.fn(),
      };
      return selector(store);
    });

    return render(<SmallMenu />);
  });

  // Test for ARIA attributes on tab buttons (accessibility)
  it("verifies that the tab buttons have proper ARIA attributes", () => {
    // Setup mocks
    (useUIStore as any).mockImplementation((selector: any) => {
      const store = {
        menuOpen: true,
        setMenuOpen: vi.fn(),
      };
      return selector(store);
    });

    render(<SmallMenu />);

    // Get buttons by their text content
    const attractorButton = screen.getByText("Attractor");
    const colorButton = screen.getByText("Color");
    const positionButton = screen.getByText("Position");

    // Verify aria-pressed and aria-expanded attributes are present on all tab buttons
    expect(attractorButton).toHaveAttribute("aria-pressed");
    expect(attractorButton).toHaveAttribute("aria-expanded");
    expect(colorButton).toHaveAttribute("aria-pressed");
    expect(colorButton).toHaveAttribute("aria-expanded");
    expect(positionButton).toHaveAttribute("aria-pressed");
    expect(positionButton).toHaveAttribute("aria-expanded");
  });
});
