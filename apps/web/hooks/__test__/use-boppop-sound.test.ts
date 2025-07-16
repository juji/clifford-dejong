import { renderHook, act } from "@testing-library/react";
import { vi } from "vitest";
import { useBopPopSound } from "../use-boppop-sound";
import { useHowl } from "../use-howl";

// Mock useHowl
vi.mock("../use-howl", () => ({
  useHowl: vi.fn(() => ({
    play: vi.fn(),
    volume: vi.fn(),
  })),
}));

describe("useBopPopSound", () => {
  it("plays bop sound when playBop is called", () => {
    const mockPlay = vi.fn();
    vi.mocked(useHowl).mockReturnValue({
      play: mockPlay,
      volume: vi.fn(),
    } as any);

    const { result } = renderHook(() => useBopPopSound());
    act(() => {
      result.current.playBop();
    });

    expect(mockPlay).toHaveBeenCalledWith("bop");
  });

  it("plays pop sound when playPop is called", () => {
    const mockPlay = vi.fn();
    vi.mocked(useHowl).mockReturnValue({
      play: mockPlay,
      volume: vi.fn(),
    } as any);

    const { result } = renderHook(() => useBopPopSound());
    act(() => {
      result.current.playPop();
    });

    expect(mockPlay).toHaveBeenCalledWith("pop");
  });

  it("sets volume correctly when setVolume is called", () => {
    const mockVolume = vi.fn();
    vi.mocked(useHowl).mockReturnValue({
      play: vi.fn(),
      volume: mockVolume,
    } as any);

    const { result } = renderHook(() => useBopPopSound());
    act(() => {
      result.current.setVolume(0.5);
    });

    expect(mockVolume).toHaveBeenCalledWith(0.5);
  });
});
