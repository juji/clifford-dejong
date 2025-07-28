
# AttractorCanvas Mobile: Solving the Property Storage RangeError

## Problem
Rendering a full-canvas attractor image on mobile with React Native Skia can cause:

    RangeError: Property storage exceeds 196607 properties

This happens because creating a single large pixel buffer (e.g., `new Uint32Array(width * height)`) exceeds the JS engine's property limit for arrays, especially on mobile devices with large screens.

## Minimal Solution

**Divide the image into smaller tiles.**

### Approach
1. **Choose a safe tile size** (e.g., 256x256 or 512x512 pixels) that will never exceed the property limit.
2. **For each tile:**
    - Allocate a buffer only for that tile (e.g., `new Uint32Array(tileWidth * tileHeight)`).
    - Render only the region of the attractor that falls within the tile (using correct offsets).
    - Convert the buffer to a Skia image and draw it at the correct position.
3. **Repeat for all tiles** to cover the full canvas.

### Why this works
- Each tile's buffer is small and safe for JS property limits.
- No single array ever exceeds the engine's property cap.
- Visually, the result is seamless if tile edges are handled correctly.

### Implementation Steps
1. In your Skia canvas component, calculate how many tiles are needed to cover the screen.
2. For each tile, generate its pixel buffer and Skia image as above.
3. Render all tiles in their correct positions.
4. Always use integer sizes and offsets for Skia compatibility.


### Implementation Details: Use Canonical Attractor and Color Code
- Use the attractor functions from `packages/core/index.ts` (`clifford`, `dejong`) for all attractor point calculations.
- Use the color utilities from `packages/core/color.ts` (`hsv2rgb`, `getColorData`) for all color mapping and pixel buffer generation.
- Do not duplicate or reimplement attractor or color logic—always import from these files.

This ensures consistency and correctness between web and mobile implementations.

---
This is the most direct and robust way to avoid the RangeError and achieve crisp, full-canvas attractor rendering on mobile.

---
This is the most direct and robust way to avoid the RangeError and achieve crisp, full-canvas attractor rendering on mobile.
