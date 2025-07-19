"use client";

import { render, screen } from "@testing-library/react";
import { SmallMenu } from "../small-menu";
import { useUIStore, type UITab } from "@/store/ui-store";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";

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

  // Test for aria-selected attributes on tab buttons (accessibility)
  it("verifies that the tab buttons have aria-selected attribute", () => {
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

    // Verify aria-selected is present on all tab buttons
    expect(attractorButton).toHaveAttribute("aria-selected");
    expect(colorButton).toHaveAttribute("aria-selected");
    expect(positionButton).toHaveAttribute("aria-selected");
  });
});
