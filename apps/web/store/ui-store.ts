import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { AttractorBenchmarkResult } from "../lib/attractor-benchmark";

export type UITab = "attractor" | "color" | "position";
export type QualityMode = "high" | "low";
export type MenuPosition = "top" | "left" | "bottom" | "right";
export type CanvasSize = { width: number; height: number };

export interface UIState {
  menuOpen: boolean;
  openTab: UITab;
  qualityMode: QualityMode;
  menuPosition: MenuPosition;
  showInfo: boolean;
  showSettings: boolean;
  fullscreen: boolean;
  progress: number;
  imageUrl: string | null;
  error: string | null;
  canvasSize: CanvasSize | null;
  canvasVisible: boolean;
  onInitResize?: () => void; // callback for initial resize
  benchmarkResult: number | null;
}

export interface UIActions {
  setMenuOpen: (open: boolean) => void;
  setOpenTab: (tab: UITab) => void;
  setQualityMode: (mode: QualityMode) => void;
  setMenuPosition: (pos: MenuPosition) => void;
  toggleInfo: () => void;
  toggleSettings: () => void;
  toggleFullscreen: () => void;
  setProgress: (progress: number) => void;
  setImageUrl: (url: string | null) => void;
  setError: (error: string | null) => void;
  setCanvasSize: (size: CanvasSize) => void;
  setCanvasVisible: (visible: boolean) => void;
  setOnInitResize: (callback: () => void) => void;
  setBenchmarkResult: (result: number | null) => void;
}

export const useUIStore = create<UIState & UIActions>()(
  devtools((set) => ({
    menuOpen: false,
    setMenuOpen: (open) => set({ menuOpen: open }),
    openTab: "attractor",
    setOpenTab: (tab) => set({ openTab: tab }),
    qualityMode: "high",
    setQualityMode: (mode) => set({ qualityMode: mode }),
    menuPosition: "left",
    setMenuPosition: (pos) => set({ menuPosition: pos }),
    showInfo: false,
    toggleInfo: () => set((state) => ({ showInfo: !state.showInfo })),
    showSettings: false,
    toggleSettings: () => set((state) => ({ showSettings: !state.showSettings })),
    fullscreen: false,
    toggleFullscreen: () => set((state) => ({ fullscreen: !state.fullscreen })),
    progress: 0,
    setProgress: (progress) => set({ progress }),
    imageUrl: null,
    setImageUrl: (url) => set({ imageUrl: url }),
    error: null,
    setError: (error) => set({ error }),
    canvasSize: null,
    setCanvasSize: (size) => set({ canvasSize: size }), 
    canvasVisible: true,
    setCanvasVisible: (visible) => set({ canvasVisible: visible }),
    setOnInitResize: (callback) => set({ onInitResize: callback }),
    benchmarkResult: null,
    setBenchmarkResult: (result) => set({ benchmarkResult: result }),
  })),
);
