import { create } from 'zustand'

export type UITab = 'attractor' | 'color' | 'position'

interface UIState {
  menuOpen: boolean
  setMenuOpen: (open: boolean) => void
  openTab: UITab
  setOpenTab: (tab: UITab) => void
}

export const useUIStore = create<UIState>((set) => ({
  menuOpen: false,
  setMenuOpen: (open) => set({ menuOpen: open }),
  openTab: 'attractor',
  setOpenTab: (tab) => set({ openTab: tab }),
}))
