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
import type { AttractorParameters } from "@repo/core/types";
import {
  calculateAttractorPoints,
  getBatchSize,
  getInterval,
} from "./shared/attractor-core";

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
      const progress = Math.round((idx / (points - 1)) * 100);
      if (progress !== lastProgress || isDone) {
        self.postMessage({
          type: isDone ? "done" : "preview",
          densityPixels: densityPixels.slice(0),
          maxDensity,
          progress,
          batch: idx,
          qualityMode,
          attractorParameters: parameters?.params,
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
