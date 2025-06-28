import { render, waitFor } from "@testing-library/react";
import { AttractorCanvas } from "../components/attractor-canvas";
import React from "react";

// Create mock functions for Zustand actions
const mockSetProgress = vi.fn();
const mockSetIsRendering = vi.fn();
const mockSetImageUrl = vi.fn();
const mockSetError = vi.fn();

// Mock Zustand store
vi.mock("../../../packages/state/attractor-store", () => {
  return {
    useAttractorStore: vi.fn((selector) =>
      selector({
        attractor: "mockAttractor",
        a: 1,
        b: 2,
        c: 3,
        d: 4,
        hue: 120,
        saturation: 100,
        brightness: 100,
        background: [0, 0, 0, 255],
        scale: 1,
        left: 0,
        top: 0,
        setProgress: mockSetProgress,
        setIsRendering: mockSetIsRendering,
        setImageUrl: mockSetImageUrl,
        setError: mockSetError,
        DEFAULT_POINTS: 1000,
        DEFAULT_SCALE: 1,
      }),
    ),
  };
});

// Robust Worker mock
let lastWorkerInstance: any = null;
globalThis.Worker = class {
  onmessage: ((e: any) => void) | null = null;
  postMessage = vi.fn();
  terminate = vi.fn();
  constructor() {
    lastWorkerInstance = this;
  }
} as any;

beforeAll(() => {
  // Mock getContext to avoid jsdom errors
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    putImageData: vi.fn(),
    createImageData: (...args: any[]) => ({ data: new Uint8ClampedArray(args[0] * args[1] * 4), width: args[0], height: args[1] }),
  })) as any;

  // Mock toDataURL to avoid jsdom errors
  Object.defineProperty(window.HTMLCanvasElement.prototype, 'toDataURL', {
    value: () => 'data:image/png;base64,mocked',
    configurable: true,
  });
});

describe("AttractorCanvas", () => {
  it("renders a canvas element", () => {
    const { container } = render(<AttractorCanvas />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeInTheDocument();
    expect(canvas?.tagName).toBe("CANVAS");
  });
});

describe("AttractorCanvas (detailed)", () => {
  beforeEach(() => {
    mockSetProgress.mockClear();
    mockSetIsRendering.mockClear();
    mockSetImageUrl.mockClear();
    mockSetError.mockClear();
  });

  it("renders and interacts with mocked Zustand store and Worker", async () => {
    const { container } = render(<AttractorCanvas />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeInTheDocument();

    // Wait for the effect that calls setProgress(0) and sets up the worker
    await waitFor(() => {
      expect(mockSetProgress).toHaveBeenCalled();
      expect(lastWorkerInstance && typeof lastWorkerInstance.onmessage === "function").toBe(true);
    });

    // Directly call the worker's onmessage handler to simulate progress
    if (lastWorkerInstance && typeof lastWorkerInstance.onmessage === "function") {
      lastWorkerInstance.onmessage({
        data: {
          type: "preview",
          pixels: new Array(1000).fill(0),
          maxDensity: 1,
          progress: 0.42,
        },
      });
    }

    // Assert both progress reset and worker progress were called
    const calls = mockSetProgress.mock.calls.flat();
    expect(calls).toContain(0);
    expect(calls).toContain(0.42);
    expect(mockSetProgress.mock.calls.length).toBeGreaterThanOrEqual(1);

    // Simulate a 'done' message from the worker
    if (
      lastWorkerInstance &&
      typeof lastWorkerInstance.onmessage === "function"
    ) {
      lastWorkerInstance.onmessage({
        data: { type: "done", pixels: new Array(1000).fill(0), maxDensity: 1 },
      });
      expect(mockSetIsRendering).toHaveBeenCalledWith(false);
      expect(mockSetImageUrl).toHaveBeenCalled();
    }

    // Simulate an 'error' message from the worker
    if (
      lastWorkerInstance &&
      typeof lastWorkerInstance.onmessage === "function"
    ) {
      lastWorkerInstance.onmessage({
        data: { type: "error", error: "Some error" },
      });
      expect(mockSetIsRendering).toHaveBeenCalledWith(false);
      expect(mockSetError).toHaveBeenCalledWith("Some error");
    }
  });
});
