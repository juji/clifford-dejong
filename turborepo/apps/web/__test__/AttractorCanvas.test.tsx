import { render } from "@testing-library/react";
import { AttractorCanvas } from "../components/AttractorCanvas";
import React from "react";

beforeAll(() => {
  // Mock getContext to avoid jsdom errors
  HTMLCanvasElement.prototype.getContext = vi.fn();
});

describe("AttractorCanvas", () => {
  it("renders a canvas element", () => {
    const { container } = render(<AttractorCanvas />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeInTheDocument();
    expect(canvas?.tagName).toBe("CANVAS");
  });

  it("accepts onProgress and onImageReady props", () => {
    const onProgress = vi.fn();
    const onImageReady = vi.fn();
    render(
      <AttractorCanvas
        onProgress={onProgress}
        onImageReady={onImageReady}
        progressInterval={1}
      />,
    );
    // No error should be thrown, and props should be accepted
    // (Worker and canvas logic are not tested here)
  });
});
