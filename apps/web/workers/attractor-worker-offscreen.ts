// AttractorWorkerOffscreen.ts
// Web Worker for attractor calculations using OffscreenCanvas (Next.js/Vite compatible)
//
// This worker specifically handles rendering with OffscreenCanvas API
// It requires browser support for OffscreenCanvas and should only be used
// when the useWorkerSupport hook returns 'offscreen' as the support level.
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
  type AttractorRunParams,
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
let offscreenCanvas: OffscreenCanvas | null = null;
let offscreenCtx: OffscreenCanvasRenderingContext2D | null = null;

// an initiated object will have parameters.params
let parameters: Params | null = null;

// on initialization
self.postMessage({ type: "ready" });

self.onmessage = function (e) {
  console.log("worker received", e.data);

  if (e.data && e.data.type === "stop") {
    handleStop();
    return;
  }

  if (e.data && e.data.type === "init") {
    console.log("data", e.data);
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

  // Handle resize for OffscreenCanvas
  if (e.data && e.data.type === "resize" && offscreenCanvas) {
    if (parameters) {
      parameters.width = e.data.width;
      parameters.height = e.data.height;
    }
    offscreenCanvas.width = e.data.width;
    offscreenCanvas.height = e.data.height;
    if (offscreenCtx) {
      offscreenCtx.clearRect(
        0,
        0,
        offscreenCanvas.width,
        offscreenCanvas.height,
      );
    }
    return;
  }

  if (e.data && e.data.type === "start") {
    handleStart();
  }
};

function initialize(data: any) {
  const { canvas } = data;

  if (rafHandle !== null) {
    self.cancelAnimationFrame(rafHandle);
    rafHandle = null;
  }

  shouldStop = false;
  parameters = data;

  // This worker requires OffscreenCanvas
  if (!canvas || !(canvas instanceof OffscreenCanvas)) {
    reportError("OffscreenCanvas is required for this worker");
    return;
  }

  offscreenCanvas = canvas;
  offscreenCtx = offscreenCanvas.getContext("2d");

  if (!offscreenCtx) {
    reportError("Could not get 2D context from OffscreenCanvas");
    return;
  }

  handleStart();
}

function handleStart() {
  if (!parameters?.params || !offscreenCanvas || !offscreenCtx) {
    reportError("Cannot start: missing parameters or OffscreenCanvas");
    return;
  }

  // Send initial progress=0 preview before any points are processed
  self.postMessage({
    type: "preview",
    progress: 0,
  });

  const { width, height } = parameters;
  offscreenCanvas.width = width;
  offscreenCanvas.height = height;
  offscreenCtx.clearRect(0, 0, width, height);

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

// This worker uses the shared attractor core module

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
}: AttractorRunParams) {
  shouldStop = false;

  // console.log("left", left, "top", top);

  // Get calculation parameters from shared helpers
  const interval = getInterval(points, progressInterval);
  const batchSize = getBatchSize(points, qualityMode);

  function drawPixels(
    densityPixels: Uint32Array,
    maxDensity: number,
    progress: number,
  ) {
    if (!offscreenCtx) return;
    const imageData = offscreenCtx.createImageData(width, height);
    const data = new Uint32Array(imageData.data.buffer);
    const bgArr = background || [0, 0, 0, 255];
    const bgColor =
      ((bgArr[3] || 255) << 24) |
      ((bgArr[2] || 0) << 16) |
      ((bgArr[1] || 0) << 8) |
      (bgArr[0] || 0);

    if (qualityMode === "low") {
      for (let i = 0; i < densityPixels.length; i++) {
        const val = Number(densityPixels[i]) || 0;
        if (val > 0) {
          // Use HSV to RGB conversion for low quality mode
          const [r, g, b] = hsv2rgb(
            hue || 120,
            saturation || 100,
            brightness || 100,
          );
          data[i] = (255 << 24) | (b << 16) | (g << 8) | r;
        } else {
          data[i] = bgColor;
        }
      }
    } else {
      for (let i = 0; i < densityPixels.length; i++) {
        const density = Number(densityPixels[i]) || 0;
        if (density > 0) {
          data[i] = getColorData(
            density,
            maxDensity,
            hue || 120,
            saturation || 100,
            brightness || 100,
            progress,
            bgArr,
          );
        } else {
          data[i] = bgColor;
        }
      }
    }
    offscreenCtx.putImageData(imageData, 0, 0);
  }

  // Setup calculation with batch progress handler
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
    onBatchProgress: (i, densityPixels, maxDensity, isDone) => {
      if (shouldStop) return;

      const progress = i / (points - 1);
      drawPixels(densityPixels, maxDensity, progress);

      const progressVal = Math.round(progress * 100);
      const typeVal = isDone ? "done" : "preview";
      self.postMessage({
        type: typeVal,
        progress: progressVal,
        qualityMode,
      });

      if (isDone) shouldStop = true;
    },
  });

  function runBatch() {
    if (shouldStop) return;
    processBatch();
    if (!shouldStop) {
      rafHandle = self.requestAnimationFrame(runBatch);
    }
  }

  rafHandle = self.requestAnimationFrame(runBatch);
}

// This worker only handles OffscreenCanvas rendering

function reportError(err: unknown) {
  self.postMessage({
    type: "error",
    error: err instanceof Error ? err.message : String(err),
  });
}
