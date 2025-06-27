# Migration Plan: Vite Project to React & React Native with Tamagui

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
- [ ] Create dark and light theme
- [ ] Create UI for attractor parameters
- [ ] Test thoroughly on web

### 5. Mobile App Setup (After Web is Stable)
- [ ] Initialize a new React Native app in `apps/mobile`
- [ ] Integrate NativeWind for styling
- [ ] Share code from the shared directory
- [ ] Migrate UI and logic to React Native components
- [ ] Test thoroughly on mobile devices

### 6. Shared UI Components
- [ ] Create shared Tamagui UI components in the shared directory
- [ ] Refactor common UI and logic here

### 7. Documentation & Cleanup
- [x] Update documentation for new structure and usage
- [x] Remove obsolete code
- [ ] Update migration plan and dev log as progress continues

---

*Last updated: 2025-06-27*

---

**Note:** shadcn/ui (chadcn) was installed and initialized in `apps/web` with Tailwind CSS. The Button component is available for use. See https://ui.shadcn.com/docs/installation/next for usage details.
