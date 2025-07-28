import { create } from 'zustand';

// Define the shape of your global state
export type GlobalState = {
  isMenuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  isAttractoMenuOpen: boolean; // Optional, can be added later
  setAttractoMenuOpen: (open: boolean) => void; // Optional, can be added later
  // Add more state properties as needed
  // Add more global state/actions here as needed
};

export const useGlobalStore = create<GlobalState>(set => ({
  isMenuOpen: false,
  setMenuOpen: open => set({ isMenuOpen: open }),
  isAttractoMenuOpen: false,
  setAttractoMenuOpen: open => set({ isAttractoMenuOpen: open }),
}));
