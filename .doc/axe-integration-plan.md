# Integration Plan: axe-core with Vitest

This document outlines the step-by-step plan for implementing task 9.1 from the accessibility checklist: integrating axe-core with Vitest using jest-axe for automated accessibility checks in unit and integration tests.

## Step 1: Install Required Packages

```bash
# Navigate to the web app directory
cd apps/web

# Install jest-axe and type definitions
npm install --save-dev jest-axe @types/jest-axe
```

## Step 2: Update Vitest Setup File

Update the `vitest.setup.ts` file to extend Vitest's expect with the jest-axe matchers:

```typescript
import "@testing-library/jest-dom";
import { vi } from "vitest";
import { toHaveNoViolations } from 'jest-axe';

// Add jest-axe matchers to Vitest
expect.extend(toHaveNoViolations);

// Mock ResizeObserver for tests
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

// Add to global
global.ResizeObserver = ResizeObserverMock;
```

## Step 3: Create Accessibility Testing Utilities

Create a utility file at `apps/web/lib/test-utils/accessibility-test-utils.tsx`:

```typescript
import { axe } from 'jest-axe';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { ReactElement } from 'react';
import { ThemeProvider } from 'next-themes';

/**
 * Custom render function that wraps the component with ThemeProvider
 * and other providers if needed for accessibility testing
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
): RenderResult {
  return render(ui, {
    wrapper: ({ children }) => (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
      </ThemeProvider>
    ),
    ...options,
  });
}

/**
 * Test component accessibility using axe
 * @param html - HTML element to test
 * @param axeOptions - Optional axe configuration options
 * @returns Promise with axe results
 */
export async function testAccessibility(html: Element, axeOptions = {}) {
  const axeResults = await axe(html, {
    rules: {
      // You can customize rules here, for example:
      // 'color-contrast': { enabled: false }, // Disable color contrast rule if needed
    },
    ...axeOptions,
  });
  
  return axeResults;
}

/**
 * Create accessibility test for a component
 * @param component - React component to render
 * @returns Promise that resolves when accessibility testing is complete
 */
export async function checkComponentAccessibility(component: ReactElement): Promise<void> {
  const { container } = renderWithProviders(component);
  const results = await testAccessibility(container);
  
  expect(results).toHaveNoViolations();
}
```

## Step 4: Create Example Accessibility Tests

Add a new test file at `apps/web/__test__/accessibility-tests.tsx`:

```typescript
import { describe, it } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { checkComponentAccessibility } from '@/lib/test-utils/accessibility-test-utils';
import { Button } from '@/components/ui/button';
import { DarkModeToggle } from '@/components/dark-mode-toggle';
import { Header } from '@/components/header';

describe('Accessibility tests with axe', () => {
  it('should have no accessibility violations in Button component', async () => {
    // Example 1: Using the helper function
    await checkComponentAccessibility(<Button>Accessible Button</Button>);
  });

  it('should have no accessibility violations in Header component', async () => {
    // Example 2: Using axe directly
    const { container } = render(<Header />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have no accessibility violations in DarkModeToggle component', async () => {
    const { container } = render(<DarkModeToggle />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('demonstrates how to test a complex form for accessibility', async () => {
    // Example of testing a more complex component
    const { container } = render(
      <form aria-labelledby="form-title">
        <h2 id="form-title">Contact Form</h2>
        <div>
          <label htmlFor="name">Name</label>
          <input id="name" type="text" />
        </div>
        <div>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" />
        </div>
        <button type="submit">Submit</button>
      </form>
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

## Step 5: Create Documentation

Add a documentation file at `apps/web/docs/ACCESSIBILITY-TESTING.md`:

```markdown
# Accessibility Testing with axe-core

This project uses axe-core with Vitest to perform automated accessibility testing. This document explains how to write and run accessibility tests.

## Overview

We use [jest-axe](https://github.com/nickcolley/jest-axe), which is a Jest wrapper around the axe-core accessibility testing engine. Even though our project uses Vitest, jest-axe is compatible through Vitest's Jest compatibility layer.

## Writing Accessibility Tests

### Basic Component Test

```typescript
import { describe, it } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';

describe('Button accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<Button>Click me</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### Using the Helper Utilities

We've created helper utilities to make testing more convenient:

```typescript
import { checkComponentAccessibility } from '@/lib/test-utils/accessibility-test-utils';

describe('Button accessibility', () => {
  it('should have no accessibility violations', async () => {
    await checkComponentAccessibility(<Button>Click me</Button>);
  });
});
```

## Custom Test Configuration

You can customize axe rules for specific tests:

```typescript
const results = await axe(container, {
  rules: {
    'color-contrast': { enabled: false }, // Disable color contrast checking
    'region': { enabled: false } // Disable region checking
  }
});
```

## Running the Tests

Run the tests with:

```bash
npm test
```

Or to run only accessibility tests:

```bash
npm test -- -t "accessibility"
```

## Common Accessibility Issues to Check

- Missing alternative text for images
- Insufficient color contrast
- Missing form labels
- Missing or incorrect ARIA attributes
- Keyboard navigation issues
- Missing document language
```

## Step 6: Verify Implementation

Run the example tests to ensure the integration is working correctly:

```bash
cd apps/web
npm test -- -t "accessibility"
```

## Step 7: Update Accessibility Checklist

After successful implementation, update the accessibility-web.md document to mark task 9.1 as complete:

```markdown
9.1 [*] Integrate `axe-core` with Vitest using `jest-axe` to add automated accessibility checks to unit and integration tests.
```

## Additional Considerations

- Ensure that all new components have corresponding accessibility tests.
- Consider adding accessibility tests to CI/CD pipelines.
- Periodically review and update the axe-core rules configuration to match project requirements.
