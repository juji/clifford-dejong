import { create } from "zustand";
import { persist } from "zustand/middleware";
import { zustandStorage } from "./zustand-storage";

import type { AttractorParameters } from "../core/types";

// state structure for attractor app
export type AttractorState = {
  attractorParameters: AttractorParameters;
};

// Separate actions from state for type safety
export type AttractorActions = {
  setAttractorParams: (params: AttractorParameters) => void;
  reset: () => void;
};

// Min and max values for different parameter types
export const paramRanges = {
  attractor: {
    a: [-3, 3],
    b: [-3, 3],
    c: [-3, 3],
    d: [-3, 3],
  },
  color: {
    hue: [0, 360],
    saturation: [0, 100],
    brightness: [0, 100],
  },
  position: {
    scale: [0.1, 20],
    left: [-2, 2],
    top: [-2, 2],
  },
};

export const defaultState: Omit<AttractorState, keyof AttractorActions> = {
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
};

export const useAttractorStore = create<AttractorState & AttractorActions>()(
  persist(
    (set, get) => ({
      ...defaultState,
      setAttractorParams: (params) =>
        set((state) => ({ ...state, attractorParameters: params })),
      reset: () => set({ ...defaultState }),
    }),
    {
      name: "attractor-store",
      storage: zustandStorage,
    },
  ),
);
