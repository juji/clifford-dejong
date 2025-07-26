import { create } from 'zustand';

// Define the shape of your global state
export type GlobalState = {
  isMenuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  // Add more global state/actions here as needed
};

export const useGlobalStore = create<GlobalState>(set => ({
  isMenuOpen: false,
  setMenuOpen: open => set({ isMenuOpen: open }),
}));
