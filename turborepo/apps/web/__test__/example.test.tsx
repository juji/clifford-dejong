import { render, screen } from "@testing-library/react";
import React from "react";

describe("Example test", () => {
  it("renders a heading", () => {
    render(<h1>Hello, Clifford-de Jong!</h1>);
    expect(screen.getByText("Hello, Clifford-de Jong!")).toBeInTheDocument();
  });
});
