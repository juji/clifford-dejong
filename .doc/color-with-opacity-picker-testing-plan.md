# Testing Plan for `ColorWithOpacityPicker` Component

This document outlines the testing strategy for the `ColorWithOpacityPicker` component, focusing on its variants, sizes, states (disabled), and accessibility.

## Test Cases:

### 1. Basic Rendering:
*   Verify that the component renders the label, color input, opacity slider, and display spans.
*   Verify that the initial `color` and `opacity` props are correctly displayed.

### 2. Color Input Interaction:
*   Simulate changing the color input value.
*   Assert that `onColorChange` is called with the new color value.
*   Verify that the displayed color text updates.

### 3. Opacity Slider Interaction:
*   Simulate changing the slider value.
*   Assert that `onOpacityChange` is called with the correctly converted opacity value (input `75` should call with `0.75`).
*   Verify that input opacity (0-1) is correctly converted to percentage (0-100) for display.
*   Verify that the displayed opacity percentage updates.
*   Verify that opacity percentage is rounded to whole numbers (`0.755` should display as `76%`).
*   Test slider props: `min={0}`, `max={100}`, `step={1}`, and array value format.

### 4. Prop Propagation:
*   Verify that `className` prop is correctly applied to the main container div.
*   Verify that `label` prop is correctly displayed.

### 5. Accessibility:
*   Verify that the color input has `type="color"`.
*   Verify that the slider has appropriate ARIA attributes (e.g., `aria-valuemin`, `aria-valuemax`, `aria-valuenow`). (This might be handled by the mocked `Slider` component, but we should ensure our mock passes these through or that the component itself sets them if `Slider` doesn't).

### 6. Edge Cases:
*   Test with `opacity` values of 0 and 1 (0% and 100%).
*   Test with empty `label` prop.
*   Test with extremely long color values (e.g., long rgba strings).

### 7. Value Display and Selection:
*   Verify that the current color value is displayed correctly.
*   Verify that the opacity percentage is displayed correctly.
*   Verify that the combined color/opacity display at the bottom has the `select-all` class.
*   Test selecting the combined value display.

### 8. Dark Mode:
*   Verify correct text colors in light and dark modes (`text-foreground`, `text-muted-foreground`).
*   Verify label and value readability in both modes.

## Implementation Details:
*   **Test File Location:** `apps/web/__test__/color-with-opacity-picker.test.tsx`
*   **Tools:** Vitest, React Testing Library
*   **Mocks:** 
    * Mock `Input` and `Slider` components from shadcn/ui.
    * Ensure mocked `Slider` correctly handles `min`, `max`, `step`, `value`, and `onValueChange` props.
    * Ensure mocked `Input` correctly handles color input events.
*   **Theme Testing:** Use `next-themes` provider for dark mode tests.
