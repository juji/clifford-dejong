import { create } from 'zustand'

export type UITab = 'attractor' | 'color' | 'position'
export type QualityMode = 'high' | 'low'
export type MenuPosition = 'top' | 'left' | 'bottom' | 'right'

interface UIState {
  menuOpen: boolean
  setMenuOpen: (open: boolean) => void
  openTab: UITab
  setOpenTab: (tab: UITab) => void
  qualityMode: QualityMode
  setQualityMode: (mode: QualityMode) => void
  menuPosition: MenuPosition
  setMenuPosition: (pos: MenuPosition) => void
  showInfo: boolean
  toggleInfo: () => void
  showSettings: boolean
  toggleSettings: () => void
  fullscreen: boolean
  toggleFullscreen: () => void
  progress: number
  setProgress: (progress: number) => void
  imageUrl: string | null
  setImageUrl: (url: string | null) => void
  error: string | null
  setError: (error: string | null) => void
}

export const useUIStore = create<UIState>((set) => ({
  menuOpen: false,
  setMenuOpen: (open) => set({ menuOpen: open }),
  openTab: 'attractor',
  setOpenTab: (tab) => set({ openTab: tab }),
  qualityMode: 'high',
  setQualityMode: (mode) => set({ qualityMode: mode }),
  menuPosition: 'left',
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
}))
