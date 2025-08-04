// AttractorWorker.ts
// Standard Web Worker for attractor calculations (Next.js/Vite compatible)
//
// This worker handles standard web worker calculations without OffscreenCanvas
// It should be used when the useWorkerSupport hook returns 'worker' or 'shared-array'
//
// progressInterval (percent, e.g. 1 = every 1%):
//   Controls how often the worker sends progress updates to the main thread.
//   Smaller values = more frequent updates (smoother UI, more overhead).
//   Larger values = fewer updates (better for slow devices).
//   This is set dynamically by the main thread based on device performance.

import { clifford, dejong } from "@repo/core";
import { getColorData, hsv2rgb } from "@repo/core/color";
import type { AttractorParameters } from "@repo/core/types";
import {
  calculateAttractorPoints,
  getBatchSize,
  getInterval,
} from "./shared/attractor-core";

// SharedArrayBuffer support
let sharedBuffer: SharedArrayBuffer | null = null;
let sharedPixels: Uint32Array | null = null;

type Params = {
  params: AttractorParameters;
  width: number;
  height: number;
  points: number;
  progressInterval: number;
  qualityMode: string;
  defaultScale: number;
};

let shouldStop = false;
let rafHandle: number | null = null;

// an initiated object will have parameters.params
let parameters: Params | null = null;

// on initialization
self.postMessage({ type: "ready" });

self.onmessage = function (e) {
  if (e.data && e.data.type === "stop") {
    handleStop();
    return;
  }

  if (e.data && e.data.type === "init") {
    initialize(e.data);
    return;
  }

  if (e.data && e.data.type === "update") {
    if (!parameters?.params) return;

    handleStop();

    const { type, ...data } = e.data;
    parameters = { ...parameters, ...data };

    handleStart();
    return;
  }

  // Handle resize
  if (e.data && e.data.type === "resize") {
    if (parameters) {
      parameters.width = e.data.width;
      parameters.height = e.data.height;
    }
    return;
  }

  if (e.data && e.data.type === "start") {
    handleStart();
  }
};

function initialize(data: any) {
  if (rafHandle !== null) {
    self.cancelAnimationFrame(rafHandle);
    rafHandle = null;
  }

  shouldStop = false;
  parameters = data;

  // Use the shared buffer provided by the main thread
  if (data.sharedBuffer) {
    sharedBuffer = data.sharedBuffer;
    if (sharedBuffer) {
      sharedPixels = new Uint32Array(sharedBuffer);
    } else {
      reportError("SharedArrayBuffer is null");
      return;
    }
  }

  handleStart();
}

function handleStart() {
  if (!parameters?.params) return;

  // Send initial progress=0 preview before any points are processed
  self.postMessage({
    type: "preview",
    progress: 0,
  });

  runAttractor(parseParams(parameters));
}

function handleStop() {
  shouldStop = true;
  if (rafHandle !== null) {
    self.cancelAnimationFrame(rafHandle);
    rafHandle = null;
  }
}

function parseParams(data: any) {
  const {
    params: {
      attractor,
      a,
      b,
      c,
      d,
      scale,
      left,
      top,
      hue = 120,
      saturation = 100,
      brightness = 100,
      background = [0, 0, 0, 255],
    },
    width,
    height,
    points,
    progressInterval = 1,
    qualityMode = "high",
    defaultScale,
  } = data;
  return {
    attractorFn: attractor === "clifford" ? clifford : dejong,
    a,
    b,
    c,
    d,
    points,
    width,
    height,
    scale: defaultScale * scale,
    left,
    top,
    progressInterval,
    qualityMode,
    hue,
    saturation,
    brightness,
    background,
  };
}

// This worker does not handle OffscreenCanvas

function runAttractor({
  attractorFn,
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
  progressInterval,
  qualityMode = "high",
  hue,
  saturation,
  brightness,
  background,
}: any) {
  shouldStop = false;
  const batchSize = getBatchSize(points, qualityMode);
  const interval = getInterval(points, progressInterval);
  let i = 0;
  let lastProgress = 0;

  // Use the shared buffer provided by the main thread
  const pixelCount = width * height;
  if (!sharedBuffer || !sharedPixels || sharedPixels.length !== pixelCount) {
    // If not provided, throw error
    reportError("SharedArrayBuffer not provided or wrong size");
    return;
  } else {
    sharedPixels.fill(0);
  }

  const { processBatch } = calculateAttractorPoints({
    attractorFn,
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
    batchSize,
    interval,
    onBatchProgress: (idx, densityPixels, maxDensity, isDone) => {
      if (shouldStop) return;

      // Apply the same color and background logic as main-thread-drawing
      const bgArr = background;
      const bgColor =
        (bgArr[3] << 24) | (bgArr[2] << 16) | (bgArr[1] << 8) | bgArr[0];
      const progress = Math.round((idx / (points - 1)) * 100);

      if (qualityMode === "low") {
        const hueVal = hue ?? 120;
        const saturationVal = saturation ?? 100;
        const brightnessVal = brightness ?? 100;
        for (let i = 0; i < densityPixels.length; i++) {
          if ((densityPixels[i] ?? 0) > 0) {
            const [r, g, b] = hsv2rgb(hueVal, saturationVal, brightnessVal);
            sharedPixels![i] = (255 << 24) | (b << 16) | (g << 8) | r;
          } else {
            sharedPixels![i] = bgColor;
          }
        }
      } else {
        const progressNorm = progress > 0 ? progress / 100 : 1;
        for (let i = 0; i < densityPixels.length; i++) {
          const density = densityPixels[i] ?? 0;
          if (density > 0) {
            sharedPixels![i] = getColorData(
              density,
              maxDensity,
              hue ?? 120,
              saturation ?? 100,
              brightness ?? 100,
              progressNorm,
              bgArr,
            );
          } else {
            sharedPixels![i] = bgColor;
          }
        }
      }

      if (progress !== lastProgress || isDone) {
        self.postMessage({
          type: isDone ? "done" : "preview",
          maxDensity,
          progress,
          batch: idx,
          qualityMode,
          attractorParameters: parameters?.params,
          width,
          height,
        });
        lastProgress = progress;
      }
    },
  });

  function step() {
    if (shouldStop) return;
    processBatch();
    if (!shouldStop && lastProgress < 100) {
      rafHandle = self.requestAnimationFrame(step);
    }
  }
  rafHandle = self.requestAnimationFrame(step);
}

function reportError(err: unknown) {
  self.postMessage({
    type: "error",
    error: err instanceof Error ? err.message : String(err),
  });
}
