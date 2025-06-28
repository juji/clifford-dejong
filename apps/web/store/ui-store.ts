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
}

export const useUIStore = create<UIState>((set) => ({
  menuOpen: false,
  setMenuOpen: (open) => set({ menuOpen: open }),
  openTab: 'attractor',
  setOpenTab: (tab) => set({ openTab: tab }),
  qualityMode: 'high',
  setQualityMode: (mode) => {
    set({ qualityMode: mode });
  },
  menuPosition: 'left',
  setMenuPosition: (pos) => set({ menuPosition: pos }),
}))
