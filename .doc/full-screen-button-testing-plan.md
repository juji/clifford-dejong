# Testing Plan for `FullScreenButton`

This document outlines the testing strategy for the `FullScreenButton` component, focusing on its conditional rendering, fullscreen API integration, pointer type detection, touch event handling, and accessibility.

## Test Cases:

### 1. Conditional Rendering:
*   Verify the button does not render if `menuOpen` is true (mock `useUIStore`).
*   Verify the button does not render if the device is detected as iOS (mock `window.navigator.userAgent`).
*   Verify the button renders if `menuOpen` is false and not on iOS.

### 2. Fullscreen Toggling (Success Path):
*   Mock `document.documentElement.requestFullscreen` and `document.exitFullscreen`.
*   Simulate a click on the button when not in fullscreen.
*   Assert that `requestFullscreen` is called.
*   Verify the button's visual state changes (e.g., `rotated` state for corners).
*   Simulate a click on the button when in fullscreen.
*   Assert that `exitFullscreen` is called.
*   Verify the button's visual state reverts.

### 3. Fullscreen API Availability:
*   Test behavior when `requestFullscreen` or `exitFullscreen` are not available (e.g., older browsers or restricted environments). The component should gracefully handle this without errors.

### 4. Pointer Type Detection:
*   Mock `window.matchMedia` to simulate `(pointer: coarse)` and `(pointer: none)`.
*   Verify the `scaleClass` is set correctly based on pointer type.

### 5. Touch Event Handling:
*   Simulate `onTouchStart` and `onTouchEnd` events.
*   Verify the class changes (`scale-75` to `scale-60` and vice-versa).

### 6. Accessibility:
*   Verify the `aria-label="Toggle fullscreen"` is correctly applied.

## Implementation Details:
*   **Test File Location:** `apps/web/__test__/full-screen-button.test.tsx`
*   **Tools:** Vitest, React Testing Library
*   **Mocks:** Mock `useUIStore`, `window.navigator.userAgent`, `document.documentElement.requestFullscreen`, `document.exitFullscreen`, and `window.matchMedia`.
