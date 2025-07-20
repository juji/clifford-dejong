/**
 * @vitest-environment jsdom
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { itHasNoA11yViolations } from "@/lib/test-utils/a11y-test-helpers";

// Mock dependencies
vi.mock("@/hooks/use-dynamic-menu-layout", () => ({
  useDynamicMenuLayout: () => ["small"],
}));

vi.mock("../small-menu", () => ({
  SmallMenu: () => <div data-testid="small-menu">Small Menu</div>,
}));

vi.mock("../big-menu", () => ({
  BigMenu: () => <div data-testid="big-menu">Big Menu</div>,
}));

// Import the MenuSheet component after mocking dependencies
import { MenuSheet } from "../index";

describe("MenuSheet", () => {
  // Accessibility test
  itHasNoA11yViolations(() => {
    return render(<MenuSheet />);
  });

  it("should have the correct id for aria-controls reference", () => {
    const { container } = render(<MenuSheet />);

    // Check that the container has the correct ID
    const menuSheet = container.querySelector("#menu-sheet");
    expect(menuSheet).not.toBeNull();
  });

  it("renders small menu when layout is small", () => {
    render(<MenuSheet />);

    // Small menu should be rendered
    expect(screen.getByTestId("small-menu")).toBeInTheDocument();
  });
});
