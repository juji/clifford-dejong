# Testing Plan for `Dialog` Components (Current Version)

This document outlines the testing strategy for the `Dialog` components, focusing on the modifications and custom styling applied to the Radix UI primitives.

## Test Cases:

### 1. Basic Open/Close Functionality:
*   Render a `Dialog` with a `DialogTrigger` and `DialogContent` (containing some text).
*   Simulate a click on the trigger.
*   Assert that the `DialogContent` (and its text) becomes visible.
*   Simulate a click on the `DialogClose` button.
*   Assert that the `DialogContent` becomes hidden.
*   Simulate pressing `Escape` when the dialog is open.
*   Assert that the `DialogContent` becomes hidden.

### 2. `DialogContent` - `showCloseButton` Prop:
*   Render `DialogContent` with `showCloseButton={false}`.
*   Assert that the close button (`XIcon`) is *not* in the document.
*   Render `DialogContent` with `showCloseButton={true}` (default).
*   Assert that the close button (`XIcon`) *is* in the document.

### 3. `DialogContent` - Close Button Accessibility and Styling:
*   Render `DialogContent` with `showCloseButton={true}`.
*   Assert that the close button has an `aria-label` of "Close dialog".
*   Verify that the `span` with `sr-only` class contains the text "Close dialog".
*   Verify the presence of specific classes on the close button: `absolute top-5 right-5`, `rounded-xs`, `opacity-70`, `transition-opacity`, `hover:opacity-100`, `focus:ring-2`, `focus:ring-offset-2`, `focus:outline-hidden`, `disabled:pointer-events-none`, `[&_svg]:pointer-events-none`, `[&_svg]:shrink-0`, `[&_svg:not([class*='size-'])]:size-4`, `cursor-pointer`.

### 4. `DialogOverlay` Styling:
*   Render a `Dialog` and open it.
*   Assert that the `DialogOverlay` has the classes: `fixed inset-0 z-50 bg-black/50`.
*   Verify animation classes (`data-[state=open]:animate-in`, `data-[state=closed]:animate-out`, `fade-out-0`, `fade-in-0`).

### 5. `DialogContent` Styling and Animation:
*   Render a `Dialog` and open it.
*   Verify the presence of specific classes on `DialogContent`: `bg-background`, `fixed top-[50%] left-[50%]`, `z-50`, `grid`, `w-full`, `max-w-[calc(100%-2rem)]`, `translate-x-[-50%]`, `translate-y-[-50%]`, `gap-4`, `rounded-lg`, `border`, `p-6`, `shadow-lg`, `duration-200`, `sm:max-w-lg`.
*   Verify animation classes (`data-[state=open]:animate-in`, `data-[state=closed]:animate-out`, `fade-out-0`, `fade-in-0`, `zoom-out-95`, `zoom-in-95`, `data-[side=bottom]:slide-in-from-top-2`, `data-[side=left]:slide-in-from-right-2`, `data-[side=right]:slide-in-from-left-2`, `data-[side=top]:slide-in-from-bottom-2`).

### 6. `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription` Styling:
*   Render a `Dialog` with these components.
*   Verify that `DialogHeader` has classes: `flex flex-col gap-2 text-center sm:text-left`.
*   Verify that `DialogFooter` has classes: `flex flex-col-reverse gap-2 sm:flex-row sm:justify-end`.
*   Verify that `DialogTitle` has classes: `text-lg leading-none font-semibold`.
*   Verify that `DialogDescription` has classes: `text-sm text-muted-foreground`.

### 7. Prop Propagation for `className`:
*   Verify that custom `className` props are correctly applied to `DialogOverlay`, `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`, and `DialogDescription`.

### 8. Accessibility Features:
*   **Focus Management:**
    - Verify that focus moves to the dialog when opened
    - Test that focus is trapped within the dialog while open
    - Ensure focus returns to the trigger element when dialog closes
    - Test Tab key navigation through all focusable elements
    - Verify Shift+Tab moves focus in reverse order

*   **ARIA Attributes and Roles:**
    - Test that dialog has appropriate `role="dialog"` or `role="alertdialog"`
    - Verify `aria-modal="true"` is present when dialog is open
    - Check `aria-labelledby` points to the DialogTitle
    - Verify `aria-describedby` points to the DialogDescription
    - Test that ARIA attributes update correctly with dialog state changes

*   **Screen Reader Compatibility:**
    - Verify dialog opening is announced with title
    - Test that description is read after title
    - Ensure close button is properly announced
    - Check that escape key functionality is announced
    - Test overlay click dismissal announcement (if enabled)

*   **Keyboard Interaction:**
    - Test Escape key closes the dialog
    - Verify Enter key on trigger opens dialog
    - Test Space key on trigger opens dialog
    - Ensure no keyboard traps exist
    - Test that keyboard shortcuts work with modifiers (if any)

*   **Modal Behavior:**
    - Verify background content is inert when dialog is open
    - Test that clicking overlay closes dialog (if enabled)
    - Ensure background content is not focusable/interactive
    - Test that screen readers cannot access background content

## Implementation Details:
*   **Test File Location:** `apps/web/__test__/dialog.test.tsx`
*   **Tools:** Vitest, React Testing Library, `@testing-library/user-event`
*   **Mocks:** No specific mocks are needed for the `Dialog` components themselves, as we are testing their wrapper functionality around Radix UI and their custom modifications. We will interact with the rendered DOM elements directly.
*   **Timing:** Use `waitFor` for asynchronous open/close transitions and animation states. Consider using `vi.useFakeTimers()` and `vi.runAllTimers()` if animations or transitions cause timing issues in tests, but prioritize testing without them if possible for simplicity.
