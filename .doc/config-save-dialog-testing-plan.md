# Testing Plan for `ConfigSaveDialog`

This document outlines the testing strategy for the `ConfigSaveDialog` component, focusing on its core functionalities: form submission and error handling.

## Test Cases:

### 1. Basic Rendering:
*   Verify the dialog renders correctly when `open` is true.
*   Verify the presence of the title, input field, and save button.
*   Verify the dialog is not rendered when `open` is false.

### 2. Form Submission - Success Path:
*   Simulate user input in the name field.
*   Simulate clicking the "Save" button.
*   Assert that `useAttractorRecordsStore().addRecord` is called with the correct `name` and `attractorParameters`.
*   Verify the button text changes to "Saving..." during the async operation.
*   Verify the "Saved!" message appears upon successful save.
*   Verify the button text changes to "Close" after success.
*   Verify the `onSave` callback is triggered.
*   Verify the input field is cleared after a successful save.

### 3. Form Submission - Error Path:
*   Simulate user input in the name field.
*   Mock `useAttractorRecordsStore().addRecord` to throw an error.
*   Simulate clicking the "Save" button.
*   Verify the button text changes to "Saving..." during the async operation.
*   Verify the error message is displayed.
*   Verify the button text remains "Save" (or "Saving..." if still in that state) and does not change to "Close".
*   Verify `onSave` is *not* called.

### 4. Input Validation:
*   Verify the "Save" button is disabled when the input field is empty or contains only whitespace.

### 5. Closing Behavior:
*   Verify that clicking the "Close" button (after a successful save) or triggering `onOpenChange` (e.g., by clicking outside the dialog or pressing Escape) resets the internal state (`name`, `success`, `error`) and calls `onOpenChange(false)`.

## Implementation Details:
*   **Test File Location:** `apps/web/__test__/config-save-dialog.test.tsx`
*   **Tools:** Vitest, React Testing Library
*   **Mocks:** Mock `useAttractorRecordsStore` and `useAttractorStore` to control their behavior during tests.
