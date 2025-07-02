# Download Button Implementation Guide

This document outlines how to implement a "Download" button for the attractor image in the web app.

## Requirements
- Allow users to download the currently rendered attractor as a PNG image.
- The download button should be a fixed-position floating action button, placed at the bottom-center of the screen.
- The button must be vertically aligned with the menu and fullscreen buttons, using the same floating/fixed style (not inside the footer).
- Use the shadcn/ui Button component for consistency and accessibility.
- Filename should be meaningful (e.g., `attractor.png` or include a timestamp/parameters).
- Button should be disabled or hidden if no image is available.
- Button must be accessible (keyboard and screen reader friendly).

## Implementation Steps

### 1. UI Placement & Style
- Create a new fixed-position button component (e.g., `DownloadButton`).
- Position it at `fixed bottom-15 left-1/2 -translate-x-1/2` (Tailwind) for bottom-center alignment.
- Use the same scale/touch logic as the menu and fullscreen buttons for a consistent look and feel.
- Do not place the button inside the footer; it should float above the footer as a sibling to other action buttons.

### 2. State/Logic
- Use the existing `imageUrl` state from the Zustand store (set via `setImageUrl` after rendering).
- The button should be enabled only if `imageUrl` is not null.

### 3. Button Component
- Use the shadcn/ui Button component for the download button, matching the style (variant, size, color, and floating/fixed positioning) of the menu and fullscreen buttons for consistency in both dark and light themes.
- The button must always display both the download icon (from lucide-react) and the text "Download" side by side (horizontally), not just as screen-reader text.
- Use a flex row layout for the icon and label, centered within the button.
- The button should have an accessible label (e.g., "Download attractor image").

### 4. Download Logic
- On click, create a temporary `<a>` element with `href={imageUrl}` and `download="attractor.png"` (or a generated filename).
- Trigger a click on the anchor to start the download.
- Clean up the anchor element after the click.

### 5. Accessibility
- Ensure the button is keyboard accessible and has an appropriate `aria-label`.

### 6. Testing
- Add a test to ensure the button appears when an image is available and triggers a download.

## Example Pseudocode
```tsx
<Button onClick={handleDownload} disabled={!imageUrl} aria-label="Download attractor image">
  Download
</Button>

function handleDownload() {
  if (!imageUrl) return;
  const a = document.createElement('a');
  a.href = imageUrl;
  a.download = `attractor-${Date.now()}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
```

---

*Update this document as you implement or refine the feature. Do not proceed to code until the plan is fully reviewed and approved.*
