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
- [x] use howler.js to preload and play sound https://howlerjs.com/
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
- [ ] Additional Settings button.
- [ ] Add tutorial.
- [ ] Add a welcome message. user can optionally follow tutorials.
- [ ] Profile attractor rendering on web
- [ ] Add user-friendly error messages for rendering and sound issues
- [ ] Implement fallbacks for unsupported browsers/devices
- [ ] Integrate basic analytics for usage tracking
- [ ] (Optional) Add error logging for public demo
- [ ] Add onboarding flow if needed
- [ ] Ensure progress indicator is visible for slow operations
- [ ] Persist user preferences (theme, sound, parameters) on web
- [ ] Set up i18n framework if planning for multiple languages
- [ ] Add translations for all user-facing text
- [ ] Review app for common web vulnerabilities
- [ ] Add a privacy policy if analytics or user data is collected
- [ ] create mute control for sounds?
- [ ] Test thoroughly on web

### 5. Mobile App Setup (After Web is Stable)
- [ ] Initialize a new React Native app in `apps/mobile`
- [ ] Integrate NativeWind for styling
- [ ] Share code from the shared directory
- [ ] Migrate UI and logic to React Native components
- [ ] Test thoroughly on mobile devices
- [ ] on web ios, create a popup that recommends the user to download from appstore
- [ ] Profile attractor rendering on mobile
- [ ] Optimize rendering or add progress indicator if slow
- [ ] Persist user preferences (theme, sound, parameters) on mobile
- [ ] Implement fallbacks for unsupported devices
- [ ] Review app for common mobile vulnerabilities
- [ ] Prepare app icons, splash screens, and store listing assets
- [ ] Review and ensure compliance with app store guidelines
- [ ] Set up i18n framework if planning for multiple languages (mobile)
- [ ] Add translations for all user-facing text (mobile)
- [ ] Add tooltips and help modals for new users (mobile)
- [ ] Add onboarding flow if needed (mobile)
- [ ] Add user-friendly error messages for rendering and sound issues (mobile)
- [ ] Integrate basic analytics for usage tracking (mobile)
- [ ] (Optional) Add error logging for public demo (mobile)
- [ ] Add a privacy policy if analytics or user data is collected (mobile)

### 6. Shared UI Components (Modular & Cross-Platform)
- [ ] Refactor and centralize all common UI, hooks, and logic that can be reused between web and mobile
- [ ] Create presentational components that work on both platforms (where possible)
- [ ] Share business logic, validation, and utility functions
- [ ] Ensure all shared UI is accessible (a11y best practices)
- [ ] Ensure shared UI supports i18n
- [ ] Ensure shared UI is performant and optimized for both web and mobile
- [ ] Document what is shared and how to extend it for future platforms

### 7. Documentation & Cleanup
- [ ] Update documentation for new structure and usage
- [ ] Remove obsolete code
- [ ] Update migration plan and dev log as progress continues
- [ ] Document accessibility, i18n, and performance strategies
- [ ] Document analytics and privacy policy (if applicable)
- [ ] Document deployment and CI/CD setup for both web and mobile

---

*Last updated: 2025-06-27*

---

**Note:** shadcn/ui (chadcn) was installed and initialized in `apps/web` with Tailwind CSS. The Button component is available for use. See https://ui.shadcn.com/docs/installation/next for usage details.

