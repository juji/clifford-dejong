---
applyTo: '**'
---

# Copilot Instructions

- Treat all manual edits and manually created files as **canonical**. Never modify or override them without explicit instruction.
- Favor **simplicity and minimalism**. Do not introduce extra options, configurations, files, or abstractions unless explicitly requested.
- Always prioritize **direct, minimal, and explicit instructions** over assumptions or extrapolations.
- Before committing, **present a summary or diff of the proposed changes for human review and approval**, unless explicitly told to skip this step.

## Project Architecture

This is a monorepo for the Clifford-deJong Attractor application, which generates beautiful mathematical art based on Clifford and deJong attractors.

### Key Components

- **Web App** (`apps/web/`): Next.js application with React
- **Mobile App** (`apps/mobile/`): React Native app for iOS/Android
- **Core Package** (`packages/core/`): Shared mathematical and type definitions
- **State Package** (`packages/state/`): Shared state management using Zustand
- **UI Package** (`packages/ui/`): Shared UI components
- **Worker Architecture**: Web app uses Web Workers for attractor calculations (`apps/web/workers/`)

### Data Flow

1. User adjusts attractor parameters via UI controls
2. Parameters are stored in `useAttractorStore` (Zustand)
3. Web workers or main thread handles the mathematical calculations
4. Canvas/display is updated with the new visualization

## Development Workflows

### Setup & Running

```bash
# Install all dependencies
npm install

# Run both web and mobile development servers
npm run dev

# Run only web app
npm run dev --filter=web

# Run only mobile app
npm run dev --filter=mobile
```

### Testing

```bash
# Run all tests
npm test

# Run specific app/package tests
npm test --filter=web
npm test --filter=mobile
npm test --filter=core
```

## Project Conventions

### File Naming Conventions

- Always use **kebab-case** for filenames, including TypeScript files.  
  ✅ `attractor-store.ts`  
  ❌ `AttractorStore.ts`
- Apply kebab-case consistently for all new files.
- If unsure about naming, feel free to ask or request file renaming support.

### Component Structure

- React components use functional components with hooks
- Common hooks are in the `hooks/` directory (`use-attractor-worker.ts`, etc.)
- Web app uses the Next.js App Router pattern

### State Management

- Zustand for state management with persistence:
  ```typescript
  // Example from packages/state/attractor-store.ts
  export const useAttractorStore = create<AttractorState & AttractorActions>()(
    persist(
      (set, get) => ({
        ...defaultState,
        setAttractorParams: (params) =>
          set((state) => ({ ...state, attractorParameters: params })),
        reset: () => set({ ...defaultState }),
      }),
      {
        name: "attractor-store",
        storage: zustandStorage,
      },
    ),
  );
  ```

### Performance Optimizations

- Web workers handle intensive mathematical calculations
- Debouncing is used for resize events and other performance-critical operations
- Dynamic point counts and quality modes based on device performance

## Commit Message Conventions

- **Always use [Conventional Commits](https://www.conventionalcommits.org/) format.** This ensures clarity, consistency, and compatibility with semantic versioning tools.
- Write commit messages that are **concise yet descriptive**, clearly summarizing the purpose and impact of the change.
- For multi-item commits, **use bullet points** to list key changes for better readability.
- If a commit fails due to linting, tests, or other checks, **reuse the original commit message** when fixing and recommitting. Do not create redundant commit histories.
