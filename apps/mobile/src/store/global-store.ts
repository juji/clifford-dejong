import { create } from 'zustand';

// Define the shape of your global state
export type GlobalState = {
  isMenuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  isAttractorMenuOpen: boolean; // Optional, can be added later
  setAttractorMenuOpen: (open: boolean) => void; // Optional, can be added later
  attractorQuality: 'high' | 'low'; // New state for attractor quality
  setAttractorQuality: (quality: 'high' | 'low') => void;
  attractorProgress: number; // Optional, can be added later
  setAttractorProgress: (progress: number) => void; // Optional, can be added later
};

export const useGlobalStore = create<GlobalState>(set => ({
  isMenuOpen: false,
  setMenuOpen: open => set({ isMenuOpen: open }),
  isAttractorMenuOpen: false,
  setAttractorMenuOpen: open => set({ isAttractorMenuOpen: open }),
  attractorQuality: 'high', // Default to high quality
  setAttractorQuality: quality => set({ attractorQuality: quality }),
  attractorProgress: 0, // Default progress
  setAttractorProgress: progress => set({ attractorProgress: progress }),
}));
