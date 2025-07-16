import { renderHook } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { usePointerControl } from "../use-pointer-control";

// Mock the store dependencies
vi.mock("@repo/state/attractor-store", () => ({
  useAttractorStore: vi.fn().mockImplementation((selector) => {
    const state = {
      attractorParameters: {
        top: 0,
        left: 0,
        scale: 1,
        attractor: "clifford",
        a: 1.5,
        b: 1.5,
        c: 1.5,
        d: 1.5,
        fps: 30,
        initialX: 0.1,
        initialY: 0.1,
        iterations: 10000,
      },
      setAttractorParams: vi.fn(),
    };
    return selector(state);
  }),
}));

vi.mock("../../store/ui-store", () => ({
  useUIStore: vi.fn().mockImplementation((selector) => {
    const state = {
      setQualityMode: vi.fn(),
    };
    return selector(state);
  }),
}));

// Import after mocking
import { useAttractorStore } from "@repo/state/attractor-store";
import { useUIStore } from "../../store/ui-store";

describe("usePointerControl", () => {
  let mockElement: HTMLDivElement;
  let mockRef: { current: HTMLDivElement | null };

  // Mock getBoundingClientRect
  const mockGetBoundingClientRect = vi.fn().mockReturnValue({
    width: 800,
    height: 600,
    top: 0,
    left: 0,
    right: 800,
    bottom: 600,
  });

  beforeEach(() => {
    mockElement = document.createElement("div");
    mockElement.getBoundingClientRect = mockGetBoundingClientRect;
    mockRef = { current: mockElement };

    // Spy on addEventListener and removeEventListener
    vi.spyOn(mockElement, "addEventListener");
    vi.spyOn(mockElement, "removeEventListener");
    vi.spyOn(window, "addEventListener");
    vi.spyOn(window, "removeEventListener");
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should attach event listeners when hook is initialized", () => {
    renderHook(() => usePointerControl(mockRef));

    // Element listeners
    expect(mockElement.addEventListener).toHaveBeenCalledWith(
      "mousedown",
      expect.any(Function),
    );
    expect(mockElement.addEventListener).toHaveBeenCalledWith(
      "wheel",
      expect.any(Function),
      { passive: false },
    );
    expect(mockElement.addEventListener).toHaveBeenCalledWith(
      "touchstart",
      expect.any(Function),
      { passive: false },
    );
    expect(mockElement.addEventListener).toHaveBeenCalledWith(
      "touchmove",
      expect.any(Function),
      { passive: false },
    );
    expect(mockElement.addEventListener).toHaveBeenCalledWith(
      "touchend",
      expect.any(Function),
      { passive: false },
    );

    // Window listeners
    expect(window.addEventListener).toHaveBeenCalledWith(
      "mousemove",
      expect.any(Function),
    );
    expect(window.addEventListener).toHaveBeenCalledWith(
      "mouseup",
      expect.any(Function),
    );
  });

  it("should remove event listeners on unmount", () => {
    const { unmount } = renderHook(() => usePointerControl(mockRef));
    unmount();

    // Element listeners
    expect(mockElement.removeEventListener).toHaveBeenCalledWith(
      "mousedown",
      expect.any(Function),
    );
    expect(mockElement.removeEventListener).toHaveBeenCalledWith(
      "wheel",
      expect.any(Function),
    );
    expect(mockElement.removeEventListener).toHaveBeenCalledWith(
      "touchstart",
      expect.any(Function),
    );
    expect(mockElement.removeEventListener).toHaveBeenCalledWith(
      "touchmove",
      expect.any(Function),
    );
    expect(mockElement.removeEventListener).toHaveBeenCalledWith(
      "touchend",
      expect.any(Function),
    );

    // Window listeners
    expect(window.removeEventListener).toHaveBeenCalledWith(
      "mousemove",
      expect.any(Function),
    );
    expect(window.removeEventListener).toHaveBeenCalledWith(
      "mouseup",
      expect.any(Function),
    );
  });

  it("should not attach event listeners if target ref is null", () => {
    renderHook(() => usePointerControl({ current: null }));
    expect(mockElement.addEventListener).not.toHaveBeenCalled();
    expect(window.addEventListener).not.toHaveBeenCalled();
  });

  it("should set quality to low on mousedown", () => {
    const setQualityModeMock = vi.fn();
    vi.mocked(useUIStore).mockReturnValue(setQualityModeMock);

    renderHook(() => usePointerControl(mockRef));

    // Get the mousedown handler
    const calls = vi.mocked(mockElement.addEventListener).mock.calls;
    const mouseDownCall = calls.find((call) => call[0] === "mousedown");
    expect(mouseDownCall).toBeDefined();

    if (mouseDownCall) {
      const mouseDownHandler = mouseDownCall[1] as EventListener;

      // Simulate mousedown event
      mouseDownHandler(
        new MouseEvent("mousedown", { clientX: 100, clientY: 100 }),
      );

      // Check if setQualityMode was called with 'low'
      expect(setQualityModeMock).toHaveBeenCalledWith("low");
    }
  });

  it("should set quality to high on mouseup", () => {
    const setQualityModeMock = vi.fn();
    vi.mocked(useUIStore).mockReturnValue(setQualityModeMock);

    renderHook(() => usePointerControl(mockRef));

    // Get mousedown and mouseup handlers
    const mouseDownCall = vi
      .mocked(mockElement.addEventListener)
      .mock.calls.find((call) => call[0] === "mousedown");
    const mouseUpCall = vi
      .mocked(window.addEventListener)
      .mock.calls.find((call) => call[0] === "mouseup");

    expect(mouseDownCall).toBeDefined();
    expect(mouseUpCall).toBeDefined();

    if (mouseDownCall && mouseUpCall) {
      const mouseDownHandler = mouseDownCall[1] as EventListener;
      const mouseUpHandler = mouseUpCall[1] as EventListener;

      // Simulate mousedown to start dragging
      mouseDownHandler(
        new MouseEvent("mousedown", { clientX: 100, clientY: 100 }),
      );

      // Clear previous mock calls
      setQualityModeMock.mockClear();

      // Simulate mouseup to end dragging
      mouseUpHandler(new MouseEvent("mouseup"));

      // Verify quality mode was set to high
      expect(setQualityModeMock).toHaveBeenCalledWith("high");
    }
  });
});
