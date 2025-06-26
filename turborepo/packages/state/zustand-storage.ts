// Cross-platform storage adapter for Zustand persist
import type { PersistStorage } from "zustand/middleware";

// Detect React Native (very basic check)
const isReactNative =
  typeof navigator !== "undefined" && navigator.product === "ReactNative";

export const zustandStorage: PersistStorage<unknown> = {
  getItem: (name) => {
    try {
      if (isReactNative) {
        // @ts-ignore
        const AsyncStorage =
          require("@react-native-async-storage/async-storage").default;
        return AsyncStorage.getItem(name).then((value: string | null) =>
          value ? JSON.parse(value) : null,
        );
      } else if (typeof window !== "undefined" && window.localStorage) {
        const value = window.localStorage.getItem(name);
        return value ? JSON.parse(value) : null;
      }
    } catch {}
    return null;
  },
  setItem: (name, value) => {
    const str = JSON.stringify(value);
    if (isReactNative) {
      // @ts-ignore
      const AsyncStorage =
        require("@react-native-async-storage/async-storage").default;
      return AsyncStorage.setItem(name, str);
    } else if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(name, str);
    }
  },
  removeItem: (name) => {
    if (isReactNative) {
      // @ts-ignore
      const AsyncStorage =
        require("@react-native-async-storage/async-storage").default;
      return AsyncStorage.removeItem(name);
    } else if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(name);
    }
  },
};
