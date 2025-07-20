import { axe } from "jest-axe";
import { render, RenderOptions, RenderResult } from "@testing-library/react";
import { ReactElement } from "react";
import { ThemeProvider } from "next-themes";

/**
 * Custom render function that wraps the component with ThemeProvider
 * and other providers if needed for accessibility testing
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
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
export async function checkComponentAccessibility(
  component: ReactElement,
): Promise<void> {
  const { container } = renderWithProviders(component);
  const results = await testAccessibility(container);

  expect(results).toHaveNoViolations();
}

/**
 * Adds an accessibility test to a component test suite
 *
 * Example usage:
 * ```
 * describe('MyComponent', () => {
 *   // Regular tests...
 *
 *   // Add accessibility test with default rendering
 *   itHasNoA11yViolations(<MyComponent prop="value" />);
 *
 *   // Or with custom rendering when component requires props or context
 *   itHasNoA11yViolations(() => render(<MyComponent complex={complexObject} />));
 * });
 * ```
 */
export function itHasNoA11yViolations(
  componentOrRenderFn: ReactElement | (() => { container: HTMLElement }),
  testName = "has no accessibility violations",
  timeout = 30000, // Default to a longer timeout
) {
  it(
    testName,
    async () => {
      let container: HTMLElement;

      if (typeof componentOrRenderFn === "function") {
        // If a render function is provided, use it
        const result = componentOrRenderFn();
        container = result.container;
      } else {
        // Otherwise, render the component directly
        const result = render(componentOrRenderFn);
        container = result.container;
      }

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    },
    timeout, // Pass the timeout to the it function
  );
}
