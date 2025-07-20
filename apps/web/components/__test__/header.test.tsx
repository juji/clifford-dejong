import { describe, it, expect, vi } from "vitest";
import { screen, render, act } from "@testing-library/react";
import { axe } from "jest-axe";
import { Header } from "../header";

// Make useEffect a no-op in tests
vi.mock("react", async () => {
  const actual = await vi.importActual("react");
  return {
    ...actual,
    useEffect: () => {},
  };
});

describe("Header", () => {
  // Custom accessibility test for Header component
  it("has no accessibility violations", async () => {
    const renderResult = render(<Header />);

    await act(async () => {
      const results = await axe(renderResult.container);
      expect(results).toHaveNoViolations();
    });
  });

  it("renders a heading with Chaos Canvas text", () => {
    render(<Header />);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading.textContent).toBe("Chaos Canvas");
  });

  it("contains a link to the homepage", () => {
    render(<Header />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/");
    expect(link.textContent).toBe("Chaos Canvas");
  });
});
