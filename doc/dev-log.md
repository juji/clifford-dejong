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

Add new entries below as work progresses.
