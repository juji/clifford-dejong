import { create } from 'zustand'

export type UITab = 'attractor' | 'color' | 'position'
export type QualityMode = 'high' | 'low'

interface UIState {
  menuOpen: boolean
  setMenuOpen: (open: boolean) => void
  openTab: UITab
  setOpenTab: (tab: UITab) => void
  qualityMode: QualityMode
  setQualityMode: (mode: QualityMode) => void
}

export const useUIStore = create<UIState>((set) => ({
  menuOpen: false,
  setMenuOpen: (open) => set({ menuOpen: open }),
  openTab: 'attractor',
  setOpenTab: (tab) => set({ openTab: tab }),
  qualityMode: 'high',
  setQualityMode: (mode) => set({ qualityMode: mode }),
}))
