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

### 1. Component Testing (Priority: HIGH)

#### Core UI Components
- [ ] **MenuSheetFooter** - Button interactions, dropdown menus, dialog triggers
- [ ] **AttractorCanvas** - Expand existing tests, canvas rendering, worker integration
- [ ] **ConfigSelectionDialog** - Form interactions, validation, save/load
- [ ] **ConfigSaveDialog** - Form submission, error handling
- [ ] **DarkModeToggle** - Theme switching
- [ ] **FullScreenButton** - Fullscreen API integration
- [ ] **ProgressIndicator** - Progress updates, animations

#### UI Library Components
- [ ] **Button** variants and states
- [ ] **ColorWithOpacityPicker** - Color selection, opacity changes
- [ ] **DropdownMenu** - Menu interactions, keyboard navigation
- [ ] **Dialog** components - Open/close, accessibility

### 2. Hook Testing (Priority: HIGH)

#### Custom Hooks
- [ ] **useAttractorWorker** - Worker lifecycle, message handling, cleanup
- [ ] **useBoppopSound** - Audio playback, loading states
- [ ] **useDebouncedValue** - Debouncing logic, timing
- [ ] **usePointerControl** - Mouse/touch interactions
- [ ] **useTouchScale** - Gesture handling, scaling calculations

### 3. Store Testing (Priority: HIGH)

#### State Management
- [ ] **AttractorStore** - Parameter updates, reset functionality, persistence
- [ ] **UIStore** - Menu position, theme state, modal states
- [ ] **AttractorRecordsStore** - CRUD operations, IndexedDB integration

### 4. Core Logic Testing (Priority: MEDIUM)

#### Mathematical Functions
- [ ] **Clifford Attractor** - Mathematical accuracy, edge cases
- [ ] **de Jong Attractor** - Parameter validation, output ranges
- [ ] **Color utilities** - HSB to RGB conversion, color manipulation
- [ ] **Canvas utilities** - Drawing operations, coordinate transformations

### 5. Worker Testing (Priority: MEDIUM)

#### Web Workers
- [ ] **AttractorWorker** - Message handling, computation accuracy, error handling
- [ ] Worker communication protocols
- [ ] Performance under load

### 6. Integration Testing (Priority: MEDIUM)

#### Feature Workflows
- [ ] **Save/Load Configuration** - End-to-end save and restore
- [ ] **Attractor Rendering** - Parameter changes to visual output
- [ ] **Quality Mode Switching** - Performance vs quality trade-offs
- [ ] **Menu Position Changes** - UI layout updates

### 7. Performance Testing (Priority: LOW)

#### Benchmarks
- [ ] **Rendering Performance** - Frame rates, memory usage
- [ ] **Worker Performance** - Computation speed, memory leaks
- [ ] **Bundle Size** - Code splitting effectiveness

### 8. Accessibility Testing (Priority: MEDIUM)

#### A11y Compliance
- [ ] **Keyboard Navigation** - All interactive elements
- [ ] **Screen Reader** - ARIA labels, semantic HTML
- [ ] **Color Contrast** - Theme compliance
- [ ] **Focus Management** - Modal and dropdown focus trapping

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

1. **Immediate**: Start with MenuSheetFooter component test
2. **Short-term**: Expand AttractorCanvas tests
3. **Medium-term**: Implement store testing utilities
4. **Long-term**: Add E2E testing with Playwright

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