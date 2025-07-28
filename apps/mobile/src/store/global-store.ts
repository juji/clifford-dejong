import { create } from 'zustand';

// Define the shape of your global state
export type GlobalState = {
  isMenuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  isAttractorMenuOpen: boolean; // Optional, can be added later
  setAttractorMenuOpen: (open: boolean) => void; // Optional, can be added later
  // Add more state properties as needed
  // Add more global state/actions here as needed
};

export const useGlobalStore = create<GlobalState>(set => ({
  isMenuOpen: false,
  setMenuOpen: open => set({ isMenuOpen: open }),
  isAttractorMenuOpen: false,
  setAttractorMenuOpen: open => set({ isAttractorMenuOpen: open }),
}));
