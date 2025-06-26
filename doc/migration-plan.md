# Migration Plan: Vite Project to React & React Native with Tamagui

## Attainable Steps

### 1. Preparation
- [x] Preserve the current working example in the `current/` directory
- [x] Clean up the root directory for migration
- [x] Document migration plan and update README

### 2. Monorepo & Tooling Setup
- [x] Choose and set up a monorepo tool (e.g., Turborepo, Nx, Yarn workspaces)
  - Turborepo is selected
- [ ] Create `apps/web` for the new React web app
- [ ] Create `apps/mobile` for the new React Native app
- [ ] Decide on a structure for shared code (e.g., `shared/` or similar)

### 3. Core Logic Extraction
- [ ] Identify and extract all core mathematical calculations (Clifford, de Jong, etc.) into the shared code directory
- [ ] Write tests for core logic to ensure correctness

### 4. Web App Migration
- [ ] Initialize a new React app in `apps/web`
- [ ] Migrate UI and logic from the current app to React components
- [ ] Integrate Tamagui for UI

### 5. Mobile App Setup
- [ ] Initialize a new React Native app in `apps/mobile`
- [ ] Integrate Tamagui for cross-platform UI
- [ ] Share code from the shared directory

### 6. Shared UI Components
- [ ] Create shared Tamagui UI components in the shared directory
- [ ] Refactor common UI and logic here

### 7. Testing & Validation
- [ ] Ensure feature parity between old and new apps
- [ ] Test on web and mobile devices

### 8. Documentation & Cleanup
- [ ] Update documentation for new structure and usage
- [ ] Remove obsolete code

---

*Last updated: 2025-06-26*
