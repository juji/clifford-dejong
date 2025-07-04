# Testing Plan for `Button` Component

This document outlines the testing strategy for the `Button` component, focusing on its variants, sizes, states (disabled), and accessibility.

## Test Cases:

### 1. Basic Rendering and Default Props:
*   Verify that the `Button` component renders a `<button>` element by default.
*   Verify that a button rendered without any `variant` or `size` props applies the `default` variant and `default` size classes.
*   Verify that the button has the base classes defined in `buttonVariants`.

### 2. Variant Props:
*   For each `variant` (e.g., `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`):
    *   Render the button with that specific variant.
    *   Assert that the button has the correct classes associated with that variant.
    *   Assert that it does *not* have classes from other variants.

### 3. Size Props:
*   For each `size` (e.g., `default`, `sm`, `lg`, `icon`):
    *   Render the button with that specific size.
    *   Assert that the button has the correct classes associated with that size.
    *   Assert that it does *not* have classes from other sizes.

### 4. Combined Variant and Size Props:
*   Render the button with a combination of a specific `variant` and `size` (e.g., `destructive` and `sm`).
*   Assert that the button has the correct classes for both the variant and the size.

### 5. `asChild` Prop:
*   Render the button with `asChild={true}` and a child element (e.g., `<a>`).
*   Assert that the rendered element is the child element (e.g., `<a>`) and not a `<button>`.
*   Verify that the classes from `buttonVariants` are correctly applied to the child element.

### 6. Disabled State:
*   Render the button with the `disabled` prop.
*   Assert that the button has the `disabled:pointer-events-none` and `disabled:opacity-50` classes.
*   Assert that the button is actually disabled (e.g., `expect(button).toBeDisabled()`).
*   Verify that clicking a disabled button does not trigger its `onClick` handler.

### 7. Custom `className` Prop:
*   Render the button with a custom `className`.
*   Assert that the custom class is present along with the `buttonVariants` classes.

### 8. Accessibility:
*   Verify that the button has `type="button"` by default.
*   Verify that the button correctly handles `aria-invalid` attribute based on its state.
*   Verify focus states (`focus-visible:border-ring`, `focus-visible:ring-ring/50`, `focus-visible:ring-[3px]`).
*   Verify hover states (`hover:cursor-pointer`, `hover:scale-75`).

### 9. SVG Icon Handling:
*   Render a button with an SVG icon as a child.
*   Verify that the `[&_svg]:pointer-events-none` and `[&_svg:not([class*='size-'])]:size-4` classes are applied to the SVG.

## Implementation Details:
*   **Test File Location:** `apps/web/__test__/button.test.tsx`
*   **Tools:** Vitest, React Testing Library
*   **Mocks:** No specific mocks are anticipated for the Button component itself, as its behavior is primarily driven by props and CSS classes. However, if testing interactions with external state management or hooks, those would be mocked as needed.
