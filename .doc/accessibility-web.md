# Clifford-deJong Attractor Web Accessibility Guide

This document outlines the accessibility implementation plan for the web version of the Clifford-deJong attractor application, ensuring it's usable by people with diverse abilities.

## Table of Contents

1. [Accessibility Goals](#accessibility-goals)
2. [Standards Compliance](#standards-compliance)
3. [Testing Tools](#testing-tools)
4. [Implementation Checklist](#implementation-checklist)
5. [Keyboard Navigation](#keyboard-navigation)
6. [Screen Reader Support](#screen-reader-support)
7. [Color and Contrast](#color-and-contrast)
8. [Motion and Animation](#motion-and-animation)
9. [Custom Components](#custom-components)
10. [Continuous Integration](#continuous-integration)
11. [Resources](#resources)

## Accessibility Goals

Our accessibility goals for the Clifford-deJong attractor web application:

- **WCAG 2.1 AA Compliance**: Meet or exceed WCAG 2.1 Level AA success criteria.
- **Inclusive Design**: Ensure the application is usable by people with diverse abilities.
- **Equivalent Experience**: Provide an equivalent experience regardless of how users interact with the application.
- **Progressive Enhancement**: Design core functionality to work without JavaScript or with assistive technologies.
- **Performance**: Maintain accessibility while delivering high-performance visualizations.

## Standards Compliance

We will adhere to the following standards:

- [Web Content Accessibility Guidelines (WCAG) 2.1 Level AA](https://www.w3.org/TR/WCAG21/)
- [WAI-ARIA 1.2](https://www.w3.org/TR/wai-aria-1.2/)
- [HTML5 Semantic Elements](https://developer.mozilla.org/en-US/docs/Web/HTML/Element)

## Testing Tools

We'll utilize these tools throughout development:

- **Chrome DevTools Accessibility Features**:
  - Accessibility Tree View to inspect how content is exposed to assistive technologies
  - Lighthouse for automated accessibility audits
  - Color contrast checker
  - Emulation of various vision deficiencies
  
- **Screen Reader Testing**:
  - VoiceOver on macOS
  - NVDA on Windows
  - Screen Reader emulators for development

- **Keyboard Navigation Testing**:
  - Tab order verification
  - Focus state visibility
  - Keyboard traps prevention

- **Automated Testing**:
  - Axe-core for component-level testing
  - Jest and Testing Library for accessibility-aware tests
  - Cypress for end-to-end accessibility testing

## Accessibility Checklist

This section organizes all accessibility tasks into categories for easier tracking and implementation.

### 1. Foundation

Basic structural and interactive elements to ensure the application is accessible from the ground up.

1.1 [*] Use proper heading hierarchy (h1-h6)
    1.1.1 [*] Some headings are used correctly, but `<h1>` is missing in `page.tsx`.
    1.1.2 [*] Ensure each page has a unique `<h1>`.

1.2 [*] Implement semantic landmarks (header, main, nav, footer)
    1.2.1 [*] Semantic landmarks like `<header>` and `<footer>` are used in `layout.tsx`.
    1.2.2 [*] Added `<main>` to define the main content area in `page.tsx`.

1.3 [*] Use appropriate HTML elements (button, a, ul/ol)
    1.3.1 [*] Buttons and links are used appropriately in most components.
    1.3.2 [*] In `page.tsx`, wrapped the main content in a `<main>` tag and grouped control buttons in a `<div role="toolbar" aria-label="Canvas controls">`.

1.4 [*] Ensure all interactive elements are focusable
    1.4.1 [*] Most interactive elements are focusable.
    1.4.2 [*] For `MenuSheet`, `Select`, and `Slider` components, all child elements are now keyboard-focusable with visible focus states.
    1.4.3 [*] For `ConfigSelectionDialog`, focus is now correctly trapped and all buttons and list items are properly focusable with proper z-index to ensure visibility.

1.5 [*] Create logical tab order
    1.5.1 [*] Logical tab order observed in `page.tsx`.

1.6 [ ] Implement keyboard shortcuts for common actions
    1.6.1 [ ] Implement `M` to toggle the settings menu (`MenuSheet`).
    1.6.2 [ ] Implement `D` to trigger the image download.
    1.6.3 [ ] Implement `F` to toggle fullscreen mode.
    1.6.4 [ ] Implement `T` to toggle between light and dark themes.

1.7 [*] Add visible focus indicators for all interactive elements
    1.7.1 [*] `focus-visible` styles are present in base `Button` and `Slider` components.
    1.7.2 [*] Audit all interactive components (e.g., `MenuToggleButton`, `DownloadButton`) to ensure they use the `focus-visible` styles consistently.

1.8 [*] Trap focus within modals and dialogs
    1.8.1 [*] Focus trapping is implemented and tested for the base `Dialog` component.
    1.8.2 [*] `ConfigSaveDialog` and `ConfigSelectionDialog` correctly trap focus when opened, and focus cycling is properly implemented within `SmallMenuSub` component.

1.9 [*] Restore focus after modal closing
    1.9.1 [*] Focus restoration is implemented and tested for the base `Dialog` component.
    1.9.2 [*] Focus is now correctly returned to the trigger button when `ConfigSaveDialog` and `ConfigSelectionDialog` are closed.

### 2. ARIA Implementation

Enhance accessibility with ARIA roles, attributes, and states to provide additional context to assistive technologies.

2.1 [*] Define main content regions with ARIA landmarks
    2.1.1 [*] In `page.tsx`, the primary content container is already using a semantic `<main>` element (completed in task 1.2.2).
    2.1.2 [*] Both `SmallMenu` and `SmallMenuSub` components now use `role="dialog"` and `aria-modal="true"` for proper ARIA landmark implementation.

2.2 [*] Add aria-label where text alternatives are needed
    2.2.1 [*] Some icon-only buttons have `aria-label` attributes.
    2.2.2 [*] Icon-only buttons like the back button in `SmallMenuSub` now have descriptive `aria-label` attributes. Continue audit for remaining buttons (`MenuToggleButton`, `DownloadButton`, `FullScreenButton`, `DarkModeToggle`).
    2.2.3 [*] In `ConfigSelectionDialog.tsx`, ensure the delete button for each configuration has a unique and descriptive `aria-label` (e.g., "Delete configuration 'My Awesome Attractor'").

2.3 [*] Implement aria-expanded for expandable elements
    2.3.1 [*] In `MenuToggleButton.tsx`, implemented `aria-expanded` to reflect the open/closed state of the `MenuSheet` and added `aria-controls="menu-sheet"` to associate it with the menu element.
    2.3.2 [*] Verified that `Select` components correctly use `aria-expanded` when their popover is open. The Radix UI Select component we use implements the ListBox WAI-ARIA design pattern which automatically manages the aria-expanded attribute on the trigger element. Radix UI's Select component implements accessibility features following the ListBox WAI-ARIA design pattern.

2.4 [*] Add aria-live regions for dynamic content
    2.4.1 [*] In `ProgressIndicator.tsx`, add an `aria-live="polite"` region to announce progress updates.
    2.4.2 [*] When saving or loading a configuration, use an `aria-live` region to announce success or failure.

2.5 [*] Apply aria-selected for selection controls
    2.5.1 [*] In `SmallMenu.tsx`, applied `aria-selected="true"` to the active tab triggers.
    2.5.2 [*] Verified that `Select` component options use `aria-selected` for the currently chosen item. The Radix UI SelectItem component we use properly implements the WAI-ARIA Listbox pattern with aria-selected managed automatically.

2.6 [*] Use aria-pressed for toggle buttons
    2.6.1 [*] In `DarkModeToggle.tsx`, added `aria-pressed` to indicate whether dark mode is active and updated tests to verify this attribute.
    2.6.2 [*] In `FullScreenButton.tsx`, added `aria-pressed` to indicate whether fullscreen mode is active, and updated the component to track fullscreen state changes.

2.7 [*] Implement aria-disabled when appropriate
    2.7.1 [ ] In `DownloadButton.tsx`, implement `aria-disabled="true"` when there's no image to download, along with visual styling changes to indicate the disabled state. Note: Implementation changed - button is not rendered at all when no image is available, making this task unnecessary.
    2.7.2 [*] In `ConfigSelectionDialog.tsx`, implemented `aria-disabled="true"` on the "Load More" button when all records are loaded (records.length >= total) and added tests to verify this behavior.

### 3. Canvas Accessibility

Make canvas-based visualizations accessible by providing alternatives and enabling interaction through assistive technologies.

3.1 [*] In `AttractorCanvas.tsx`, added `role="img"` to the `<canvas>` element to identify it as an image.
3.2 [*] Dynamically generated a descriptive `aria-label` for the canvas that includes the current attractor's parameters (e.g., "An abstract geometric pattern generated with Clifford attractor parameters a=-1.7, b=1.8, c=-0.9, d=-0.4.").
3.3 [-] (Optional) Provide a visually hidden `<div>` linked with `aria-describedby` to offer a more detailed explanation of the visual pattern. Note: The `aria-label` from 3.2 may be sufficient without this additional description.
3.4 [ ] Ensure the sounds from `use-boppop-sound`, `use-done-sound`, and `use-waiting-sound` provide meaningful auditory feedback for the start, progress, and completion of the rendering process.

### 4. Keyboard Navigation

Ensure the application is fully navigable using a keyboard, with logical focus order and intuitive shortcuts.

4.1 [*] Reviewed and verified the tab sequence in `page.tsx` flows logically from the menu controls to the main parameter sliders. Added a proper test to verify the tab order follows: menuToggleButton → downloadButton → fullScreenButton → darkModeToggle.
4.2 [ ] Add documentation for keyboard shortcuts (`M`, `D`, `F`, `T`) directly within the existing `MenuSheet` interface rather than creating a separate dialog.
4.3 [*] ESC key handling is now properly implemented for menu navigation: ESC closes tabs in SmallMenuSub, ESC closes dialogs without closing menu, and focus is restored appropriately.
4.4 [*] Verified that all custom controls (`Slider`, `Select`, `ColorWithOpacityPicker`) are fully operable using only the keyboard (e.g., arrow keys for sliders, space/enter to open selects).

### 5. Screen Reader Support

Provide meaningful content and feedback for users relying on screen readers to navigate the application.

5.1 [*] For the main `<canvas>`, provide a text alternative that describes the visual content, as detailed in items 3.2 and 3.3.
5.2 [*] Use the `sr-only` class for the descriptive `aria-label` text on icon-only buttons to ensure it's available to screen readers but not visually displayed.
    5.2.1 [*] Icon-only buttons (`MenuToggleButton`, `DarkModeToggle`, `FullScreenButton`) now have both `aria-label` and matching `sr-only` text.
    5.2.2 [*] `DownloadButton` already has visible text "Download", so no additional `sr-only` text is needed.
5.3 [ ] Ensure all purely decorative SVG icons or visual elements are hidden from screen readers using `aria-hidden="true"`.

### 6. Color and Contrast

Ensure visual elements are accessible to users with visual impairments by maintaining sufficient contrast and avoiding reliance on color alone.

6.1 [ ] Use browser developer tools to audit the entire application in both light and dark modes to ensure text and UI components meet WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text and components).
6.2 [ ] Verify that interactive elements do not rely on color alone to indicate state (e.g., a selected tab should have a visual indicator other than just a color change).
6.3 [*] The app uses `next-themes` which respects system preferences for light/dark mode. Verify this behavior is working as expected.

### 7. Motion and Animation

Make motion and animation accessible by respecting user preferences and providing controls to manage animations.

7.1 [*] Verify that all animations and transitions, especially those from `tailwindcss-animate`, respect the `prefers-reduced-motion` media query by disabling or reducing them.
    7.1.1 [*] Added CSS media query `@media (prefers-reduced-motion: reduce)` in `globals.css` that sets minimal animation durations and disables transitions when the user has reduced motion preferences enabled.
7.2 [ ] Ensure the progress indicator animation is subtle and does not flash or distract users.

### 8. Custom Components

Ensure custom UI components are accessible by implementing proper roles, states, and keyboard interactions.

8.1 [*] Audit `ColorWithOpacityPicker.tsx` to ensure the color swatch and slider are fully keyboard accessible and announce their state to screen readers.
    8.1.1 [*] Added proper ARIA attributes including `role="group"`, `aria-labelledby`, `aria-label`, and `aria-description`.
    8.1.2 [*] Added `aria-live="polite"` regions for dynamic content (color and opacity values) to announce changes to screen readers.
    8.1.3 [*] Used unique IDs to associate labels with form elements.
    8.1.4 [*] Added screen-reader-only labels and descriptions for elements.
    8.1.5 [*] Added appropriate tests to verify accessibility attributes.
8.2 [ ] For the `Select` component, verify that it follows the ARIA patterns for a listbox, including proper roles (`listbox`, `option`) and state management (`aria-selected`).
8.3 [ ] For the `MenuSheet.tsx`, ensure it functions as a disclosure widget with correct `aria-expanded` and `aria-controls` attributes on the trigger button.

### 9. Continuous Integration

Integrate accessibility into the development workflow to ensure ongoing compliance and improvement.

9.1 [ ] Integrate `axe-core` with Vitest using `jest-axe` to add automated accessibility checks to unit and integration tests.
9.2 [ ] Document the process for manual accessibility testing with VoiceOver (macOS) and NVDA (Windows) in a `TESTING.md` file.

## Resources To Read and Ponder Upon.

- [MDN Web Docs: Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [Web.dev Learn Accessibility](https://web.dev/learn/accessibility/)
- [A11Y Project Checklist](https://www.a11yproject.com/checklist/)
- [Deque University](https://dequeuniversity.com/)
- [WebAIM](https://webaim.org/)
