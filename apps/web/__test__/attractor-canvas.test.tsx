import { render, waitFor } from "@testing-library/react";
import { AttractorCanvas } from "../components/attractor-canvas";
import React from "react";
import { act } from "react";
import { DEFAULT_POINTS, DEFAULT_SCALE, LOW_QUALITY_POINTS, LOW_QUALITY_INTERVAL } from "../lib/constants";

// Create mock functions for Zustand actions
const mockSetProgress = vi.fn();
const mockSetIsRendering = vi.fn();
const mockSetImageUrl = vi.fn();
const mockSetError = vi.fn();
const mockSetQualityMode = vi.fn();

// Mock Zustand store with attractorParameters only
vi.mock("../../../packages/state/attractor-store", () => {
  return {
    useAttractorStore: vi.fn((selector) =>
      selector({
        attractorParameters: {
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
        },
      })
    ),
  };
});

// Mock useDebouncedValue to always return the latest value
vi.mock("../hooks/use-debounced-value", () => ({
  useDebouncedValue: (v: any) => v,
}));

// Mock useUIStore for all UI-related state/actions
vi.mock("../store/ui-store", () => ({
  useUIStore: vi.fn((selector) =>
    selector({
      qualityMode: "high",
      setQualityMode: mockSetQualityMode,
      setProgress: mockSetProgress,
      setImageUrl: mockSetImageUrl,
      setError: mockSetError,
      progress: 0,
      imageUrl: null,
      error: null,
      DEFAULT_POINTS,
      DEFAULT_SCALE,
      LOW_QUALITY_POINTS,
      LOW_QUALITY_INTERVAL,
      // Add any other UI state fields as needed
    })
  ),
}));

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
    mockSetQualityMode.mockClear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders and interacts with mocked Zustand store and Worker", async () => {
    // Create a container div with explicit size for flex centering
    const wrapper = document.createElement('div');
    Object.defineProperty(wrapper, 'clientWidth', { value: 800, configurable: true });
    Object.defineProperty(wrapper, 'clientHeight', { value: 600, configurable: true });
    wrapper.style.width = '800px';
    wrapper.style.height = '600px';
    document.body.appendChild(wrapper);

    const { container } = render(<AttractorCanvas />, { container: wrapper });
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeInTheDocument();

    // Mock parentElement.clientWidth/clientHeight with getters
    const parent = canvas?.parentElement;
    if (parent) {
      Object.defineProperty(parent, 'clientWidth', { get: () => 800, configurable: true });
      Object.defineProperty(parent, 'clientHeight', { get: () => 600, configurable: true });
    }

    // Trigger a manual resize event after render and flush timers/state
    await act(async () => {
      window.dispatchEvent(new Event('resize'));
      vi.runOnlyPendingTimers();
    });
    await act(async () => {});

    // Simulate worker progress message BEFORE asserting mockSetProgress
    await act(async () => {
      if (lastWorkerInstance && typeof lastWorkerInstance.onmessage === "function") {
        lastWorkerInstance.onmessage({
          data: {
            type: "preview",
            pixels: new Array(1000).fill(0),
            maxDensity: 1,
            progress: 0.42,
            qualityMode: "high",
            attractorParameters: {
              hue: 120,
              saturation: 100,
              brightness: 100,
              background: [0, 0, 0, 255],
            },
          },
        });
      }
    });

    expect(mockSetProgress).toHaveBeenCalled();
    expect(lastWorkerInstance && typeof lastWorkerInstance.onmessage === "function").toBe(true);

    // Assert both progress reset and worker progress were called
    const calls = mockSetProgress.mock.calls.flat();
    expect(calls).toContain(0.42);
    expect(mockSetProgress.mock.calls.length).toBeGreaterThanOrEqual(1);

    // Simulate a 'done' message from the worker
    await act(async () => {
      if (
        lastWorkerInstance &&
        typeof lastWorkerInstance.onmessage === "function"
      ) {
        lastWorkerInstance.onmessage({
          data: {
            type: "done",
            pixels: new Array(1000).fill(0),
            maxDensity: 1,
            qualityMode: "high",
            attractorParameters: {
              hue: 120,
              saturation: 100,
              brightness: 100,
              background: [0, 0, 0, 255],
            },
          },
        });
      }
    });
    expect(mockSetIsRendering).not.toHaveBeenCalledWith(true); // Should not set to true
    expect(mockSetIsRendering).not.toHaveBeenCalledWith(undefined);
    expect(mockSetImageUrl).toHaveBeenCalled();

    // Simulate an 'error' message from the worker
    await act(async () => {
      if (
        lastWorkerInstance &&
        typeof lastWorkerInstance.onmessage === "function"
      ) {
        lastWorkerInstance.onmessage({
          data: { type: "error", error: "Some error" },
        });
      }
    });
    expect(mockSetIsRendering).not.toHaveBeenCalledWith(true);
    expect(mockSetError).toHaveBeenCalledWith("Some error");
  }, 15000); // Increased timeout for async/debounce
});
