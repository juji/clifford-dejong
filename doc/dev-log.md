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

Add new entries below as work progresses.
