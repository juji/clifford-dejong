# Testing Plan for `DarkModeToggle`

This document outlines the testing strategy for the `DarkModeToggle` component, focusing on its theme switching functionality and accessibility.

## Test Cases:

### 1. Basic Rendering:
*   Verify the component renders correctly when `loaded` is true.
*   Verify the correct icon (Sun for dark mode, Moon for light mode) is displayed based on the initial theme.
*   Verify the presence of the toggle button and its `aria-label`.

### 2. Theme Toggling:
*   Simulate a click on the toggle button.
*   Assert that `setTheme` is called with the opposite of the current theme (e.g., if current is 'dark', `setTheme('light')` should be called).
*   Verify the icon changes after clicking the button (e.g., from Sun to Moon, or Moon to Sun).

### 3. Hydration Mismatch Handling:
*   Verify that the component initially renders `null` (or nothing) and then renders the actual UI after the `useEffect` hook sets `loaded` to `true`.

### 4. Accessibility:
*   Verify the `aria-label="Toggle dark mode"` is correctly applied to the button.

## Implementation Details:
*   **Test File Location:** `apps/web/__test__/dark-mode-toggle.test.tsx`
*   **Tools:** Vitest, React Testing Library
*   **Mocks:** Mock `next-themes`'s `useTheme` hook to control and assert theme changes.
