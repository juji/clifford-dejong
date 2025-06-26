import { render, screen } from "@testing-library/react";

describe("Example", () => {
  it("renders text", () => {
    render(<div>Hello Test</div>);
    expect(screen.getByText("Hello Test")).toBeInTheDocument();
  });
});
