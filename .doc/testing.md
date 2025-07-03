# Testing Strategy for Clifford-de Jong Project

## Current State Analysis

### ✅ What's Already Set Up
- **Vitest** configured with React support
- **React Testing Library** for component testing
- **jsdom** environment for DOM testing
- Basic tests for:
  - `AttractorCanvas` component
  - Sound download functionality
  - Core Clifford/de Jong algorithms

### ❌ What's Missing
- Component test coverage (~5% currently)
- Store/state management testing
- Hook testing
- Integration testing
- E2E testing
- Performance testing
- Visual regression testing

## Testing Strategy Breakdown

### 📋 **UNIFIED LINEAR CHECKLIST** (Execute in Order)

#### 🔥 **IMMEDIATE PRIORITIES** (A- → A+ Grade)
- [ ] **IntersectionObserver Mock** - Fix mock in `config-selection-dialog.test.tsx` to un-skip 6 tests
- [x] **DialogContent Accessibility** - Add missing `Description` or `aria-describedby` to fix warnings
- [x] **Clifford Test** - Add snapshot test with known input/output for mathematical accuracy
- [x] **de Jong Test** - Add snapshot test with known input/output for mathematical accuracy

#### ✅ **COMPLETED COMPONENTS**
- [x] **MenuSheetFooter** - Button interactions, dropdown menus, dialog triggers (11 tests)
- [x] **AttractorCanvas** - Canvas rendering, worker integration (19 tests) 
- [x] **ConfigSelectionDialog** - Form interactions, validation, save/load (24 tests) ⚠️ *6 tests skipped - fix above*

#### 📱 **NEXT COMPONENTS**
- [ ] **ConfigSaveDialog** - Form submission, error handling
- [ ] **DarkModeToggle** - Theme switching
- [ ] **FullScreenButton** - Fullscreen API integration
- [ ] **ProgressIndicator** - Progress updates, animations

#### 🎨 **UI LIBRARY COMPONENTS**
- [ ] **Button** variants and states
- [ ] **ColorWithOpacityPicker** - Color selection, opacity changes
- [ ] **DropdownMenu** - Menu interactions, keyboard navigation
- [ ] **Dialog** components - Open/close, accessibility

#### 🎣 **HOOKS**
- [ ] **useAttractorWorker** - Worker lifecycle, message handling, cleanup
- [ ] **useBoppopSound** - Audio playback, loading states
- [ ] **useDebouncedValue** - Debouncing logic, timing
- [ ] **usePointerControl** - Mouse/touch interactions
- [ ] **useTouchScale** - Gesture handling, scaling calculations

#### 🗃️ **STORES**
- [ ] **AttractorStore** - Parameter updates, reset functionality, persistence
- [ ] **UIStore** - Menu position, theme state, modal states
- [ ] **AttractorRecordsStore** - CRUD operations, IndexedDB integration

#### 🧮 **MATH & UTILITIES**
- [x] **Clifford Attractor** - Basic shape validation and snapshot testing ✅
- [x] **de Jong Attractor** - Basic shape validation and snapshot testing ✅
- [ ] **Color utilities** - HSB to RGB conversion, color manipulation
- [ ] **Canvas utilities** - Drawing operations, coordinate transformations

#### 👷 **WORKERS**
- [ ] **AttractorWorker** - Message handling, computation accuracy, error handling
- [ ] Worker communication protocols
- [ ] Performance under load

#### 🔗 **INTEGRATION**
- [ ] **Save/Load Configuration** - End-to-end save and restore
- [ ] **Attractor Rendering** - Parameter changes to visual output
- [ ] **Quality Mode Switching** - Performance vs quality trade-offs
- [ ] **Menu Position Changes** - UI layout updates

#### ♿ **ACCESSIBILITY**
- [ ] **Keyboard Navigation** - All interactive elements
- [ ] **Screen Reader** - ARIA labels, semantic HTML
- [ ] **Color Contrast** - Theme compliance
- [ ] **Focus Management** - Modal and dropdown focus trapping

#### ⚡ **PERFORMANCE**
- [ ] **Rendering Performance** - Frame rates, memory usage
- [ ] **Worker Performance** - Computation speed, memory leaks
- [ ] **Bundle Size** - Code splitting effectiveness

#### 🎭 **VISUAL TESTING**
- [ ] **Screenshot testing** - Setup and regression detection
- [ ] **Storybook integration** - Component documentation and testing

## Implementation Plan

### Phase 1: Foundation (Week 1-2)
1. **Test Utilities Setup**
   - Custom render function with providers
   - Mock factories for stores and workers
   - Test data generators

2. **Core Component Tests**
   - MenuSheetFooter (current focus)
   - AttractorCanvas (expand existing)
   - Basic UI components

### Phase 2: State & Logic (Week 3-4)
1. **Store Testing**
   - Zustand store test utilities
   - State persistence testing
   - Action testing with mock scenarios

2. **Hook Testing**
   - Custom hook test utilities
   - Worker hook testing
   - Audio hook testing

### Phase 3: Integration (Week 5-6)
1. **Feature Testing**
   - Save/load workflows
   - Rendering pipelines
   - Error handling scenarios

2. **Performance Testing**
   - Benchmark setup
   - Memory leak detection
   - Bundle analysis

### Phase 4: Polish (Week 7-8)
1. **Accessibility Testing**
   - A11y test automation
   - Manual testing protocols

2. **Visual Testing**
   - Screenshot testing setup
   - Regression detection

## Testing Tools & Libraries

### Current Stack
- **Vitest** - Test runner
- **React Testing Library** - Component testing
- **jsdom** - DOM environment

### Recommended Additions
- **@testing-library/user-event** - User interaction simulation
- **@testing-library/jest-dom** - Enhanced matchers (already imported)
- **msw** - API mocking (if needed for future features)
- **@vitest/coverage-v8** - Coverage reporting
- **happy-dom** - Faster DOM environment alternative

### For Advanced Testing
- **Playwright** - E2E testing (future consideration)
- **Storybook** - Component documentation and testing
- **Chromatic** - Visual regression testing

## Coverage Goals

### Target Coverage by Phase
- **Phase 1**: 40% overall, 80% for core components
- **Phase 2**: 60% overall, 90% for stores and hooks
- **Phase 3**: 75% overall, 95% for critical paths
- **Phase 4**: 80% overall, 100% for public APIs

### Coverage Exclusions
- Third-party library code
- Configuration files
- Build scripts
- Development utilities

## Testing Best Practices

### Component Testing
```typescript
// Example structure for component tests
describe('ComponentName', () => {
  describe('Rendering', () => {
    // Basic rendering tests
  })
  
  describe('User Interactions', () => {
    // Click, input, navigation tests
  })
  
  describe('State Integration', () => {
    // Store integration tests
  })
  
  describe('Accessibility', () => {
    // A11y specific tests
  })
})
```

### Store Testing
```typescript
// Example structure for store tests
describe('StoreName', () => {
  describe('Initial State', () => {
    // Default values, hydration
  })
  
  describe('Actions', () => {
    // State mutations
  })
  
  describe('Selectors', () => {
    // Derived state
  })
  
  describe('Persistence', () => {
    // Local storage, IndexedDB
  })
})
```

## Next Steps

Execute the **UNIFIED LINEAR CHECKLIST** above in order. Start with 🔥 **IMMEDIATE PRIORITIES** to reach A+ grade, then continue down the list.

### 📊 **Current Status: A Grade**
- **Total Tests**: 55 passing + 6 skipped + 2 new = 63 tests
- **Next Target**: A+ Grade (fix IntersectionObserver mock to un-skip 6 tests)

## Maintenance

### Automated Testing
- **Pre-commit hooks** - Run tests before commits
- **CI/CD integration** - Automated test runs on PRs
- **Coverage reporting** - Track coverage trends
- **Performance monitoring** - Benchmark regression detection

### Manual Testing
- **Monthly accessibility audits**
- **Cross-browser testing**
- **Mobile responsiveness testing**
- **Performance profiling**

## External Review Summary

### Overall Grade: **A-** → Target: **A+**

**Files Reviewed:**
1. `config-selection-dialog.test.tsx` - Excellent (A-) - *skipped tests & accessibility warnings*
2. `attractor-canvas.test.tsx` - Good (B+) - *tests logic, not visual output*
3. `menu-sheet-footer.test.tsx` - Excellent (A) - *comprehensive UI testing*
4. `sound-download.test.ts` - Good but Simple (B) - *basic but sufficient*
5. `clifford.test.ts` - Sufficient but Basic (C+) - *needs value verification*
6. `dejong.test.ts` - Sufficient but Basic (C+) - *needs value verification*

**Key Findings:**
- ✅ Modern testing practices, well-structured
- ✅ Comprehensive UI component coverage
- ✅ Good user interaction testing
- ❌ 6 skipped tests (IntersectionObserver mock)
- ❌ Real accessibility bugs discovered
- ❌ Math tests only verify shape, not values