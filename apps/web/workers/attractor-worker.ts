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

// cubicBezier(1,-0.01,.66,1.01)

self.onmessage = function (e) {

  if (e.data && e.data.type === "stop") {
    handleStop();
    return;
  }

  try {
    const params = parseParams(e.data);
    runAttractor(params);
  } catch (err) {
    reportError(err);
  }

};

function handleStop() {
  shouldStop = true;

  if (rafHandle !== null) {
    self.cancelAnimationFrame(rafHandle);
    rafHandle = null;
  }

  self.postMessage({ type: "stopped" });
}

function parseParams(data: any) {
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
  } = data;

  return {
    attractorFn: attractor === "clifford" ? clifford : dejong,
    a, b, c, d, points, width, height, scale, left, top, progressInterval
  };
}

function runAttractor({
  attractorFn,
  a, b, c, d,
  points, width, height, scale, left, top,
  progressInterval
}: any) {
  let x = 0, y = 0;
  const pixels = new Uint32Array(width * height);
  let maxDensity = 0;
  const interval = Math.max(1, Math.floor(points * (progressInterval / 100)));
  const batchSize = Math.max(1000, Math.floor(points / 1000));
  let i = 0;
  shouldStop = false;

  function smoothing(num: number, scale: number) {
    return num + (Math.random() < 0.5 ? -0.2 : 0.2) * (1 / scale);
  }

  function processBatch() {

    if (shouldStop) return;

    const end = Math.min(i + batchSize, points);

    for (; i < end; i++) {

      const [nxRaw, nyRaw] = attractorFn(x, y, a, b, c, d) as [number, number];
      let nx = smoothing(nxRaw, scale);
      let ny = smoothing(nyRaw, scale);
      x = nx;
      y = ny;
      const screenX = Math.round(x * scale);
      const screenY = Math.round(y * scale);
      const px = Math.floor(screenX + width / 2 + left * width);
      const py = Math.floor(screenY + height / 2 + top * height);

      if (px >= 0 && px < width && py >= 0 && py < height) {
        const idx = px + py * width;
        pixels[idx] = (pixels[idx] || 0) + 1;
        if (pixels[idx] > maxDensity) maxDensity = pixels[idx];
      }

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
}

function reportError(err: unknown) {
  self.postMessage({
    type: "error",
    error: err instanceof Error ? err.message : String(err),
  });
}
