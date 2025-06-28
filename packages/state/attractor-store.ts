import { create } from "zustand";
import { persist } from "zustand/middleware";
import { zustandStorage } from "./zustand-storage";

// Example state structure for attractor app
export type AttractorState = {
  attractor: "clifford" | "dejong";
  a: number;
  b: number;
  c: number;
  d: number;
  hue: number;
  saturation: number;
  brightness: number;
  background: [number, number, number, number];
  scale: number;
  left: number;
  top: number;
  progress: number;
  isRendering: boolean;
  imageUrl: string | null;
  showInfo: boolean;
  showSettings: boolean;
  fullscreen: boolean;
  error: string | null;
  DEFAULT_POINTS: number;
  DEFAULT_SCALE: number;
  LOW_QUALITY_POINTS: number;
  LOW_QUALITY_INTERVAL: number;
  qualityMode: "high" | "low";
};

// Separate actions from state for type safety
export type AttractorActions = {
  setAttractorType: (type: "clifford" | "dejong") => void;
  setParam: (
    key: keyof Omit<AttractorState, keyof AttractorActions>,
    value: number,
  ) => void;
  setColor: (hue: number, saturation: number, brightness: number) => void;
  setBackground: (rgba: [number, number, number, number]) => void;
  setScale: (scale: number) => void;
  setOffset: (left: number, top: number) => void;
  setProgress: (progress: number) => void;
  setIsRendering: (isRendering: boolean) => void;
  setImageUrl: (url: string | null) => void;
  toggleInfo: () => void;
  toggleSettings: () => void;
  toggleFullscreen: () => void;
  reset: () => void;
  setError: (error: string | null) => void;
  setQualityMode: (mode: "high" | "low") => void;
};

const defaultState: Omit<AttractorState, keyof AttractorActions> = {
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
  progress: 0,
  isRendering: false,
  imageUrl: null,
  showInfo: false,
  showSettings: false,
  fullscreen: false,
  error: null,
  DEFAULT_POINTS: 20000000,
  DEFAULT_SCALE: 150,
  LOW_QUALITY_POINTS: 5000,
  LOW_QUALITY_INTERVAL: 25,
  qualityMode: "high",
};

export const useAttractorStore = create<AttractorState & AttractorActions>()(
  persist(
    (set, get) => ({
      ...defaultState,
      setAttractorType: (type) => set({ attractor: type }),
      setParam: (key, value) => set((state) => ({ ...state, [key]: value })),
      setColor: (hue, saturation, brightness) =>
        set({ hue, saturation, brightness }),
      setBackground: (rgba) => set({ background: rgba }),
      setScale: (scale) => set({ scale }),
      setOffset: (left, top) => set({ left, top }),
      setProgress: (progress) => {
        set({ progress });
      },
      setIsRendering: (isRendering) => set({ isRendering }),
      setImageUrl: (url) => set({ imageUrl: url }),
      toggleInfo: () => set((state) => ({ showInfo: !state.showInfo })),
      toggleSettings: () =>
        set((state) => ({ showSettings: !state.showSettings })),
      toggleFullscreen: () =>
        set((state) => ({ fullscreen: !state.fullscreen })),
      reset: () => set({ ...defaultState }),
      setError: (error) => set({ error }),
      setQualityMode: (mode) => set({ qualityMode: mode }),
    }),
    {
      name: "attractor-store",
      storage: zustandStorage,
    },
  ),
);
