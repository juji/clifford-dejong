# Clifford-deJong Attractor Mobile Implementation Guide

This document provides a step-by-step guide for implementing the mobile version of the Clifford-deJong attractor application using React Native.

## Phase 1: Environment Setup (Week 1)

### 1.1 Project Initialization

- [ ] Create the React Native app

```bash
# Navigate to the repository root
cd /Users/juji/play/clifford-dejong/apps

# Initialize the new React Native app directly in the apps directory
npx react-native init mobile --template react-native-template-typescript
```

- [ ] Update package.json with necessary dependencies

```bash
cd /Users/juji/play/clifford-dejong/apps/mobile
npm install react-native-skia @shopify/react-native-skia
npm install react-native-reanimated
npm install react-native-orientation-locker
npm install react-native-safe-area-context
npm install nativewind
npm install --save-dev tailwindcss
npm install --save-dev babel-plugin-module-resolver
```

### 1.2 TypeScript Configuration

- [ ] Configure TypeScript for cross-platform compatibility

```bash
# Navigate to the mobile app directory
cd /Users/juji/play/clifford-dejong/apps/mobile

# Copy base TypeScript config from packages/typescript-config
cp ../../packages/typescript-config/base.json ./tsconfig.json
```

- [ ] Update the TypeScript configuration to include React Native types

```json
{
  "extends": "../../packages/typescript-config/base.json",
  "compilerOptions": {
    "jsx": "react-native",
    "types": ["react-native"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@repo/*": ["../../packages/*"]
    }
  },
  "include": ["src", "index.js"]
}
```

### 1.3 Monorepo Integration

- [ ] Add mobile app to Turborepo configuration
- [ ] Update root turbo.json to include mobile app
- [ ] Create mobile-specific build and lint scripts
- [ ] Configure path aliases in tsconfig.json for `@/` and `@repo/` imports

### 1.4 NativeWind Setup

- [ ] Initialize Tailwind configuration

```bash
cd /Users/juji/play/clifford-dejong/apps/mobile
npx tailwindcss init
```

- [ ] Configure Tailwind CSS for NativeWind

```js
// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      // Match web theme extensions for consistency
    },
  },
  plugins: [],
};
```

- [ ] Set up Babel configuration for NativeWind

```json
// babel.config.js
module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    'nativewind/babel',
    'react-native-reanimated/plugin',
    [
      'module-resolver',
      {
        root: ['.'],
        alias: {
          '@': './src',
          '@repo': '../../packages'
        }
      }
    ]
  ],
};
```

### 1.5 Development Environment Verification

- [ ] Run the app on iOS simulator

```bash
cd /Users/juji/play/clifford-dejong/apps/mobile
npm run ios
```

- [ ] Run the app on Android emulator

```bash
cd /Users/juji/play/clifford-dejong/apps/mobile
npm run android
```

- [ ] Verify that all dependencies are correctly linked

```bash
cd /Users/juji/play/clifford-dejong/apps/mobile
npx react-native doctor
```

## Phase 2: Core Shared Logic (Weeks 2-3)

### 2.1 Package Import Structure

- [ ] Import core attractor logic from packages/core

```tsx
// src/attractors/index.ts
export * from "@repo/core";
```

- [ ] Create platform-specific entry points for shared modules

```tsx
// src/attractors/platform.ts
import { Platform } from "react-native";

export const isNative = true;
export const isMobile = true;
export const isIOS = Platform.OS === "ios";
export const isAndroid = Platform.OS === "android";
```

### 2.2 State Management

- [ ] Import Zustand store from packages/state
- [ ] Create mobile-specific store configuration

```tsx
// src/store/index.ts
import { createAttractorStore } from "@repo/state/attractor-store";
import { createMMKVStorage } from "@/store/mmkv-storage"; // Platform-specific storage

export const useAttractorStore = createAttractorStore(
  createMMKVStorage("attractorStore"),
);
```

### 2.3 Mobile-Specific Storage

- [ ] Implement MMKV storage adapter for React Native

```bash
cd /Users/juji/play/clifford-dejong/apps/mobile
npm install react-native-mmkv
```

```tsx
// src/store/mmkv-storage.ts
import { MMKV } from "react-native-mmkv";

export const createMMKVStorage = (storageName: string) => {
  const storage = new MMKV({ id: storageName });

  return {
    getItem: (key: string) => {
      const value = storage.getString(key);
      return value === undefined ? null : value;
    },
    setItem: (key: string, value: string) => {
      storage.set(key, value);
    },
    removeItem: (key: string) => {
      storage.delete(key);
    },
  };
};
```

### 2.4 Testing Framework

- [ ] Set up Jest configuration for React Native
- [ ] Create test utils for shared components
- [ ] Write cross-platform tests for core logic

## Phase 3: UI Component Adaptation (Weeks 4-6)

### 3.1 Navigation Structure

- [ ] Install React Navigation

```bash
cd /Users/juji/play/clifford-dejong/apps/mobile
npm install @react-navigation/native @react-navigation/native-stack
npm install react-native-screens
```

- [ ] Set up basic navigation structure

```tsx
// src/navigation/index.tsx
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { HomeScreen } from "@/screens/home";
import { SettingsScreen } from "@/screens/settings";

const Stack = createNativeStackNavigator();

export const AppNavigation = () => (
  <NavigationContainer>
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  </NavigationContainer>
);
```

### 3.2 Base Screen Components

- [ ] Create home screen component
- [ ] Create settings screen component
- [ ] Implement safe area handling

### 3.3 UI Component Migration

- [ ] Create mobile versions of key UI components:
  - [ ] Attractor Canvas (Skia-based)
  - [ ] Parameter Controls
  - [ ] Theme Toggle
  - [ ] Menu Sheet
  - [ ] Download Button

### 3.4 Mobile-Specific Styling

- [ ] Create theme provider with NativeWind
- [ ] Implement dark mode support
- [ ] Create mobile-optimized layout components

### 3.5 Screen Orientation

- [ ] Implement orientation handling

```tsx
// src/hooks/use-orientation.ts
import { useEffect } from "react";
import Orientation from "react-native-orientation-locker";

export const useOrientation = (lockToPortrait = true) => {
  useEffect(() => {
    if (lockToPortrait) {
      Orientation.lockToPortrait();
    } else {
      Orientation.unlockAllOrientations();
    }

    return () => {
      Orientation.unlockAllOrientations();
    };
  }, [lockToPortrait]);
};
```

## Phase 4: Canvas & Performance (Weeks 7-9)

### 4.1 Skia Setup

- [ ] Create Skia canvas component

```tsx
// src/components/attractor-canvas.tsx
import { Canvas, useCanvas } from "@shopify/react-native-skia";
import { useWindowDimensions } from "react-native";
import { useAttractorStore } from "@/store";

export const AttractorCanvas = () => {
  const { width, height } = useWindowDimensions();

  return (
    <Canvas style={{ width, height }}>
      {/* Skia drawing implementation */}
    </Canvas>
  );
};
```

### 4.2 Attractor Drawing Implementation

- [ ] Port attractor calculation logic to Skia worklets
- [ ] Implement pixel array generation similar to web worker

### 4.3 Pixel Manipulation with Skia

- [ ] Implement direct pixel manipulation

```tsx
// Example implementation approach
import { Skia, useCanvas, Image, useValue } from "@shopify/react-native-skia";
import { useWindowDimensions } from "react-native";

export const AttractorRenderer = () => {
  const { width, height } = useWindowDimensions();
  const canvasRef = useCanvas();

  const renderAttractor = (pixels: Uint8Array) => {
    const imageInfo = {
      width: canvasWidth,
      height: canvasHeight,
      alphaType: Skia.AlphaType.Unpremul,
      colorType: Skia.ColorType.RGBA_8888,
    };

    const pixelImage = Skia.MakeImage(imageInfo, pixels, canvasWidth * 4);

    // Draw image to canvas
    if (pixelImage && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.drawImage(pixelImage, 0, 0);
    }
  };

  // Implementation continues...
};
```

### 4.4 Reanimated Integration

- [ ] Create worklets for performance-critical calculations
- [ ] Implement shared transition animations
- [ ] Optimize UI responsiveness

### 4.5 Memory Optimization

- [ ] Implement efficient buffer management
- [ ] Add cleanup for large pixel arrays
- [ ] Monitor memory usage with React Native performance tools

## Phase 5: Testing & Polish (Weeks 10-11)

### 5.1 Device Testing

- [ ] Test on multiple iOS devices
- [ ] Test on multiple Android devices
- [ ] Test performance on low-end devices

### 5.2 Accessibility

- [ ] Implement accessibility labels
- [ ] Test with VoiceOver and TalkBack
- [ ] Ensure proper contrast and touch targets

### 5.3 Final Optimizations

- [ ] Reduce app size
- [ ] Optimize startup time
- [ ] Final performance tuning

### 5.4 Store Preparation

- [ ] Create app icons and splash screens
- [ ] Write app store descriptions
- [ ] Prepare screenshots for app stores

## Phase 6: Deployment (Post Implementation)

### 6.1 Fastlane Setup

- [ ] Configure Fastlane for iOS
- [ ] Configure Fastlane for Android
- [ ] Set up CI/CD integration

### 6.2 App Store Deployment

- [ ] Submit to Apple App Store
- [ ] Submit to Google Play Store

### 6.3 Post-Launch

- [ ] Monitor analytics and crash reports
- [ ] Plan for updates and improvements

## References

- [React Native Skia Documentation](https://shopify.github.io/react-native-skia/docs/getting-started/installation)
- [React Native Skia Images](https://shopify.github.io/react-native-skia/docs/images)
- [Reanimated Documentation](https://docs.swmansion.com/react-native-reanimated/)
- [Fastlane Documentation](https://docs.fastlane.tools)
- [React Native Orientation Locker](https://github.com/wonday/react-native-orientation-locker)
- [React Native MMKV](https://github.com/mrousavy/react-native-mmkv)
- [NativeWind Documentation](https://www.nativewind.dev/quick-starts/react-native-cli)
