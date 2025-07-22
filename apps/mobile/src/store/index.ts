/**
 * Mobile store integration for Zustand
 * This file provides utilities for using the shared store in React Native
 */

import { useAttractorStore } from '@repo/state/attractor-store';
import { Platform } from 'react-native';

// Export a platform check utility to verify environment
export const isReactNativeCheck = () => {
  return (
    typeof navigator !== 'undefined' &&
    navigator.product === 'ReactNative' &&
    Platform.OS !== undefined
  );
};

// Export the store directly for use in components
export { useAttractorStore };

// Export types
export type {
  AttractorState,
  AttractorActions,
} from '@repo/state/attractor-store';
