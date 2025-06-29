import { create } from "zustand";
import { persist } from "zustand/middleware";
import { zustandStorage } from "./zustand-storage";

import type { AttractorParameters } from "../core/types";

// state structure for attractor app
export type AttractorState = {
  attractorParameters: AttractorParameters;
  progress: number;
  imageUrl: string | null;
  showInfo: boolean;
  showSettings: boolean;
  fullscreen: boolean;
  error: string | null;
  DEFAULT_POINTS: number;
  DEFAULT_SCALE: number;
  LOW_QUALITY_POINTS: number;
  LOW_QUALITY_INTERVAL: number;
};

// Separate actions from state for type safety
export type AttractorActions = {
  setAttractorParams: (params: AttractorParameters) => void;
  setProgress: (progress: number) => void;
  setImageUrl: (url: string | null) => void;
  toggleInfo: () => void;
  toggleSettings: () => void;
  toggleFullscreen: () => void;
  reset: () => void;
  setError: (error: string | null) => void;
};

const defaultState: Omit<AttractorState, keyof AttractorActions> = {
  attractorParameters: {
    attractor: "clifford",
    a: 2,
    b: -2,
    c: 1,
    d: -1,
    hue: 333,
    saturation: 100,
    brightness: 100,
    background: [0, 0, 0, 255],
    scale: 1,
    left: 0,
    top: 0,
  },
  progress: 0,
  imageUrl: null,
  showInfo: false,
  showSettings: false,
  fullscreen: false,
  error: null,
  DEFAULT_POINTS: 20000000,
  DEFAULT_SCALE: 150,
  LOW_QUALITY_POINTS: 20000,
  LOW_QUALITY_INTERVAL: 10,
};

export const useAttractorStore = create<AttractorState & AttractorActions>()(
  persist(
    (set, get) => ({
      ...defaultState,
      setAttractorParams: (params) => set((state) => ({ ...state, attractorParameters: params })),
      setProgress: (progress) => { set({ progress }); },
      setImageUrl: (url) => set({ imageUrl: url }),
      toggleInfo: () => set((state) => ({ showInfo: !state.showInfo })),
      toggleSettings: () =>
        set((state) => ({ showSettings: !state.showSettings })),
      toggleFullscreen: () =>
        set((state) => ({ fullscreen: !state.fullscreen })),
      reset: () => set({ ...defaultState }),
      setError: (error) => set({ error }),
    }),
    {
      name: "attractor-store",
      storage: zustandStorage,
    },
  ),
);
