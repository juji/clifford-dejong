# Migration Plan: Vite Project to React & React Native

## Attainable Steps

### 1. Preparation
- [x] Preserve the current working example in the `current/` directory
- [x] Clean up the root directory for migration
- [x] Document migration plan and update README

### 2. Monorepo & Tooling Setup
- [x] Choose and set up a monorepo tool (Turborepo)
- [x] Create `apps/web` for the new React web app
- [x] Decide on a structure for shared code (e.g., `packages/`)

### 3. Core Logic Extraction
- [x] Identify and extract all core mathematical calculations (Clifford, de Jong, etc.) into the shared code directory
- [x] Write tests for core logic to ensure correctness

### 4. Web App Migration (First Priority)
- [x] Initialize a new React app in `apps/web`
- [x] Migrate UI and logic from the current app to React components (in progress/partial)
- [x] Implement a basic canvas, to ensure correctness. The canvas, should by default draw the attractor with default params
- [x] use worker to lighten load on main thread
- [x] Integrate Zustand for state management
- [x] Add footer, fixed element on the bottom
- [x] Create a progress indicator for attractor rendering
- [x] use chadcn (shadcn/ui installed and initialized in apps/web)
- [x] Check dark and light theme
- [x] Create a Full screen button
- [x] on ios, full screen button should not exist
- [x] Create UI for attractor parameters
- [x] Optimize rendering or add progress indicator if slow
- [x] Check and improve color contrast
- [x] Add a download button
- [x] PWA integration
- [x] Test accessibility with axe or Lighthouse
- [x] Ensure all UI is screen reader accessible
- [ ] Set up i18n framework if planning for multiple languages
- [ ] Add translations for all user-facing text

### 5. Mobile App Setup (After Web is Stable)
- [ ] Initialize a new React Native app in `apps/mobile` using pure React Native CLI (not Expo)
- [ ] Set up TypeScript configuration similar to web app
- [ ] Integrate NativeWind for styling (consistent with web Tailwind approach)
- [x] Configure shared packages in monorepo for cross-platform usage
- [ ] Create platform-specific entry points for shared components
- [ ] Implement mobile navigation structure
- [ ] Create mobile-specific versions of core components
- [ ] Set up Fastlane for automated build and deployment
  - [ ] Configure Fastlane for iOS build and App Store submission
  - [ ] Configure Fastlane for Android build and Play Store deployment
  - [ ] Set up CI/CD integration with Fastlane
- [ ] Test thoroughly on iOS and Android devices
- [ ] on web ios, create a popup that recommends the user to download from appstore

### 6. Platform-Specific Feature Implementation
- [ ] Implement canvas rendering with React Native Skia:
  - [ ] Set up React Native Skia for high-performance drawing
  - [ ] Implement pixel manipulation via Skia's Uint8Array and Image API (see reference [issue #2199](https://github.com/Shopify/react-native-skia/issues/2199))
  - [ ] Use Skia's Image.MakeImage with raw pixel data for attractor rendering
  - [ ] Use Reanimated for UI thread performance with worklets
  - [ ] Implement the attractor drawing algorithm as worklets
    - [ ] Check `apps/web/workers/attractor-worker.ts` for implementing the attractor calculation, the resulting image should be 100% exact with the web-version
    - [ ] Use the exact same color generation code from `packages/core/color.ts`, including `hsv2rgb` and `getColorData` functions, to ensure identical visual output
    - [ ] Match all bezier curve effects and color transformations for pixel-perfect rendering
  - [ ] Optimize memory usage for large pixel arrays
- [ ] Implement touch-optimized controls:
  - [ ] Replace hover states with appropriate touch feedback
  - [ ] Adapt UI sizing for touch targets (minimum 44×44 points)
  - [ ] Implement gesture handlers for pinch-to-zoom and other mobile interactions

---

## React Native Conversion Timeline

Based on the current state of the web application and the complexity of features, here's an estimated timeline for converting to React Native:

1. **Environment Setup**: 1 week
   - Initialize React Native project
   - Configure monorepo for cross-platform development
   - Set up shared TypeScript configurations

2. **Core Shared Logic**: 1-2 weeks
   - Move pure logic to platform-agnostic packages
   - Create abstraction layers for platform-specific APIs
   - Set up testing framework for cross-platform code

3. **UI Component Adaptation**: 2-3 weeks
   - Convert core UI components to React Native
   - Implement React Native Skia for canvas rendering
   - Create platform-specific styling system with NativeWind

4. **Canvas & Performance**: 2-3 weeks
   - Implement attractor rendering with React Native Skia
   - Create Reanimated worklets for UI thread performance
   - Optimize pixel manipulation with direct Uint8Array access
   - Use notifyChange() for efficient updates to rendering
   - Implement efficient memory management for large pixel arrays

5. **Testing & Polish**: 2 weeks
   - Cross-device testing (various iOS/Android devices)
   - Performance optimization
   - Accessibility improvements

**Total estimated time**: 8-11 weeks for a production-ready React Native version, assuming 1 full-time developer.

### Accelerating React Native Development

With the recent improvements in the web version, particularly the pure feature detection approach in components like the fullscreen button, we can potentially speed up the React Native conversion:

1. **Leveraging Existing Architecture**: 
   - The clean separation of logic in hooks and state management will transfer easily
   - Existing tests can be adapted for cross-platform validation

2. **Component Reuse Strategy**:
   - Create platform-specific versions only where necessary (like view/screen controls)
   - Share all pure logic components without modification

3. **Fast-Track Options**:
   - Use pure React Native with Fastlane for deployment automation
   - Employ React Native Web for maximum code sharing
   - Utilize existing hooks with minimal changes

With a focused effort on the minimal viable product features, an initial React Native version could be ready for testing in as little as 4-6 weeks.

### Approach for View Mode Controls

React Native apps run fullscreen by default, so instead of a fullscreen button we need different view controls:

1. **Status Bar Management**: Use React Native's StatusBar component to control visibility:
   ```javascript
   import { StatusBar } from 'react-native';
   
   // Hide the status bar for more immersive experience
   StatusBar.setHidden(true);
   
   // Or with component
   <StatusBar hidden={true} />
   ```

2. **Immersive Mode** (Android): For completely hiding system UI:
   ```javascript
   // Using a library like react-native-immersive
   import Immersive from 'react-native-immersive';
   
   // Full immersive mode
   Immersive.setImmersive(true);
   ```

3. **Screen Orientation**: Control orientation with react-native-orientation:
   ```javascript
   import Orientation from 'react-native-orientation-locker';
   
   // Lock to portrait mode
   Orientation.lockToPortrait();
   ```

4. **Platform-Specific Handling**:
   ```javascript
   import { Platform } from 'react-native';
   
   const configureViewMode = () => {
     if (Platform.OS === 'android') {
       // Android-specific immersive mode
     } else {
       // iOS-specific options
     }
   };
   ```

### Key Challenges to Address

1. **Background Processing**: Replace Web Workers with Reanimated worklets for UI thread optimization
2. **Canvas Rendering**: Implement with React Native Skia for high-performance rendering
3. **Pixel Manipulation**: Use Skia's direct pixel manipulation via Uint8Array and notifyChange() as demonstrated in [issue #2199](https://github.com/Shopify/react-native-skia/issues/2199)
4. **Performance Optimization**: Ensure attractor animations remain smooth on lower-end devices
5. **Platform Testing**: Test on various device sizes and OS versions

---

*Last updated: 2025-06-27*

---

**Note:** shadcn/ui (chadcn) was installed and initialized in `apps/web` with Tailwind CSS. The Button component is available for use. See https://ui.shadcn.com/docs/installation/next for usage details.

---

## References and Resources

1. [React Native Skia Issue #2199](https://github.com/Shopify/react-native-skia/issues/2199) - Discussion on pixel manipulation techniques for high-performance drawing with Skia and Reanimated
2. [React Native Skia Documentation](https://shopify.github.io/react-native-skia/docs/getting-started/installation) - Official documentation for React Native Skia
3. [React Native Skia Images](https://shopify.github.io/react-native-skia/docs/images) - Documentation on image handling and pixel data manipulation in Skia
4. [Reanimated Documentation](https://docs.swmansion.com/react-native-reanimated/) - For implementing performant UI thread animations
5. [Fastlane Documentation](https://docs.fastlane.tools) - For automating build and release workflows for iOS and Android apps
6. [React Native Orientation Locker](https://github.com/wonday/react-native-orientation-locker) - For controlling screen orientation in React Native apps

