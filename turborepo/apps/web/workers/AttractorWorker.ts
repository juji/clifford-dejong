// AttractorWorker.ts
// Web Worker for attractor calculations (Next.js/Vite compatible)
//
// progressInterval (percent, e.g. 1 = every 1%):
//   Controls how often the worker sends progress updates to the main thread.
//   Smaller values = more frequent updates (smoother UI, more overhead).
//   Larger values = fewer updates (better for slow devices).
//   This is set dynamically by the main thread based on device performance.

import { clifford, dejong } from "@repo/core";

let shouldStop = false;
let rafHandle: number | null = null;

self.onmessage = function (e) {
  if (e.data && e.data.type === "stop") {
    // Stop signal received from main thread
    shouldStop = true;
    if (rafHandle !== null) {
      self.cancelAnimationFrame(rafHandle);
      rafHandle = null;
    }
    self.postMessage({ type: "stopped" });
    return;
  }
  try {
    const {
      attractor,
      a,
      b,
      c,
      d,
      points,
      width,
      height,
      scale,
      left,
      top,
      progressInterval = 1,
    } = e.data;
    // Select attractor function
    const attractorFn = attractor === "clifford" ? clifford : dejong;
    let x = 0,
      y = 0;
    const pixels = new Uint32Array(width * height);
    let maxDensity = 0;
    // Calculate how many points per progress update
    const interval = Math.max(1, Math.floor(points * (progressInterval / 100)));
    // Use a smaller batch size for more responsive interruption
    const batchSize = Math.max(1000, Math.floor(points / 1000)); // ~1000 batches, min 1000 points per batch
    let i = 0;
    shouldStop = false;
    function smoothing(num: number, scale: number) {
      return num + (Math.random() < 0.5 ? -0.2 : 0.2) * (1 / scale);
    }
    function processBatch() {
      if (shouldStop) {
        return;
      }
      const end = Math.min(i + batchSize, points);
      for (; i < end; i++) {
        // Calculate next point
        const result = attractorFn(x, y, a, b, c, d);
        let nx =
          Array.isArray(result) && typeof result[0] === "number"
            ? result[0]
            : 0;
        let ny =
          Array.isArray(result) && typeof result[1] === "number"
            ? result[1]
            : 0;
        // Apply smoothing to each step
        nx = smoothing(nx, scale);
        ny = smoothing(ny, scale);
        x = nx;
        y = ny;
        // Map to screen
        const screenX = Math.round(x * scale);
        const screenY = Math.round(y * scale);
        const px = Math.floor(screenX + width / 2 + left * width);
        const py = Math.floor(screenY + height / 2 + top * height);
        if (px >= 0 && px < width && py >= 0 && py < height) {
          const idx = px + py * width;
          pixels[idx] = (pixels[idx] || 0) + 1;
          if (pixels[idx] > maxDensity) maxDensity = pixels[idx];
        }
        // Post preview at the configured interval or at the end
        if ((i > 0 && i % interval === 0) || i === points - 1) {
          self.postMessage({
            type: i === points - 1 ? "done" : "preview",
            pixels: pixels.slice(0),
            maxDensity,
            progress: Math.round((i / points) * 100),
            batch: i,
          });
        }
      }
      if (i < points && !shouldStop) {
        rafHandle = self.requestAnimationFrame(processBatch);
      }
    }
    rafHandle = self.requestAnimationFrame(processBatch);
  } catch (err) {
    // Report errors to main thread
    self.postMessage({
      type: "error",
      error: err instanceof Error ? err.message : String(err),
    });
  }
};
