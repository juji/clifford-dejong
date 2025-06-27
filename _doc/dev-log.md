# Migration & Development Log

This document tracks major changes, migrations, and development milestones for the Clifford-de Jong Attractor Wallpaper Creator monorepo.

---

## 2025-06-26 09:00 UTC
- Initialized Turborepo monorepo structure with `apps/` and `packages/` directories.
- Preserved legacy Vite project in `current/`.
- Cleaned up all template code and UI components for a blank Next.js app and UI package.
- Updated metadata and font setup in Next.js app.
- Committed all changes for a clean, ready-to-develop monorepo.

---

## 2025-06-26 15:00 UTC
- Migrated core attractor logic and color utilities to `packages/core`.
- Implemented and tested core logic with Vitest.
- Created a generic, parameterized `AttractorCanvas` React component for web, matching legacy rendering (density buffer, color mapping, smoothing, scaling, batching).
- Added support for RGBA background with opacity, including fillStyle for visual consistency.
- Added device performance benchmark utility and responsive batching for smooth rendering.
- Cleaned up project structure and committed all tracked/untracked files.

---

## 2025-06-26 20:00 UTC
- Planned and scaffolded Zustand state management with cross-platform storage (web: localStorage, React Native: AsyncStorage).
- Created `packages/state` with a fully-typed attractor store and storage adapter.
- Updated lint/build scripts to treat warnings as errors and enforce a clean codebase.
- Refactored `AttractorCanvas.tsx` to remove all lint warnings and unused variables.
- Committed all outstanding changes, including migration plan, package updates, and lockfile.

---

## 2025-06-26 22:00 UTC
- Researched off-main-thread computation for attractor rendering in both web and React Native.
- Determined that on web, Web Workers are the best practice for heavy calculations.
- For React Native, found that [joltup/react-native-threads](https://github.com/joltup/react-native-threads) is the maintained solution for running JS in a separate process (multi-process, not true threading).
- Noted that multi-process increases memory usage but is necessary for heavy, blocking calculations to keep the UI responsive.
- Recommendation: Only use multi-process/threading if profiling shows UI jank; otherwise, keep calculations on the main JS thread for simplicity.
- Documented the tradeoffs and alternatives for both platforms in the migration plan and dev log.

---

## 2025-06-27 18:00 UTC

### Monorepo & Tamagui/Next.js Modernization
- Migrated and cleaned up monorepo dependencies, set up linting, Husky, and workspace structure.
- Integrated Tamagui into the web app, including initial config, provider, and demo button.
- Added a fixed footer, progress indicator, and demo Tamagui button (later removed).
- Implemented a theme toggle button (initially with emoji, then Lucide icons).
- Switched from custom event-based theming to Tamagui’s official SSR-safe approach using `@tamagui/next-theme`.
- Created a `NextTamaguiProvider` component for SSR, theming, and style injection, following Tamagui's official App Directory pattern.
- Updated `app/layout.tsx` to use `NextTamaguiProvider`.
- Updated the theme toggle to use `useThemeSetting` and `useRootTheme` from `@tamagui/next-theme`.
- Cleaned up and removed legacy/the old provider and demo button files.
- Installed and configured all required packages at the monorepo root: `@tamagui/next-theme`, `@tamagui/polyfill-dev`, `@tamagui/core`, `react-native-web`, and `react-native`.
- Updated `next.config.js` to use the `withTamagui` plugin with `appDir: true` and ES module syntax, resolving all config errors.
- Fixed SSR style extraction by switching `StyleSheet` import to `react-native-web`.
- Resolved missing type errors by installing `@types/react-native-web` and updating `tsconfig.json`.
- Fixed all lint and type errors, including isolatedModules and explicit-any issues.
- Removed the unused SSR styles file (`TamaguiSSRStyles.tsx`) and all references from the codebase.
- Committed all changes with clear, descriptive messages.

### Rationale
- Ensured robust, SSR-safe theming and style extraction with Tamagui and Next.js App Directory.
- Avoided hydration errors and mismatches between server and client theme state.
- Kept the codebase clean and maintainable, following best practices from the latest Tamagui documentation.

### Issues & Current Status
- **Theme switching is broken:** The theme does not work as expected. The theme toggle button is still not functioning correctly, and the app does not reliably switch between light, dark, and system themes.
- **Unsuccessful AI edits:** Several attempts to fix the theme logic and button behavior have not resolved the issue. The AI has made multiple unsuccessful edits, and the problem persists.
- **Next steps:** Further debugging and investigation are required to achieve robust, user-controllable theming with Tamagui and Next.js App Directory.

---

Add new entries below as work progresses.
