// AttractorWorker.ts
// Web Worker for attractor calculations (Next.js/Vite compatible)
//
// progressInterval (percent, e.g. 1 = every 1%):
//   Controls how often the worker sends progress updates to the main thread.
//   Smaller values = more frequent updates (smoother UI, more overhead).
//   Larger values = fewer updates (better for slow devices).
//   This is set dynamically by the main thread based on device performance.

import { clifford, dejong } from "@repo/core";
import { getColorData } from "@repo/core/color";
import type { AttractorParameters } from "@repo/core/types";

type Params = {
  params: AttractorParameters,
  width: number,
  height: number,
  points: number,
  progressInterval : number,
  qualityMode: string,
  defaultScale: number,
}

let shouldStop = false;
let rafHandle: number | null = null;
let offscreenCanvas: OffscreenCanvas | null = null;
let offscreenCtx: OffscreenCanvasRenderingContext2D | null = null;

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
    initialize(e.data)
    return;
  }

  if (e.data && e.data.type === "update") {
    if(!parameters?.params) return;

    handleStop();

    const { type, ...data } = e.data;
    parameters = { ...parameters, ...data };

    handleStart()
    return;
  }

  // Handle resize for OffscreenCanvas
  if (e.data && e.data.type === "resize" && offscreenCanvas) {
    if(parameters){
      parameters.width = e.data.width;
      parameters.height = e.data.height;
    }
    offscreenCanvas.width = e.data.width;
    offscreenCanvas.height = e.data.height;
    if (offscreenCtx) {
      offscreenCtx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
    }
    return;
  }

  if (e.data && e.data.type === "start") {
    handleStart()
  }

};

function initialize( data: any ){
  const { canvas } = data;

  if (rafHandle !== null) {
    self.cancelAnimationFrame(rafHandle);
    rafHandle = null;
  }

  shouldStop = false;
  offscreenCanvas = null;
  offscreenCtx = null;
  parameters = data

  if(canvas){
    offscreenCanvas = canvas;
    if (offscreenCanvas) {
      offscreenCtx = offscreenCanvas.getContext("2d");
    }
  } else {
    offscreenCanvas = null
    offscreenCtx = null;
  }

  handleStart()


}

function handleStart(){
  if(!parameters?.params) return;
  
  // Send initial progress=0 preview before any points are processed
  self.postMessage({
    type: "preview",
    progress: 0,
  });

  if(offscreenCanvas && offscreenCtx) {
    const { width, height } = parameters;
    offscreenCanvas.width = width;
    offscreenCanvas.height = height;
    if (offscreenCtx) {
      offscreenCtx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
    }
    runAttractorOffscreen(parseParams(parameters));
  }
  else {
    runAttractor(parseParams(parameters));
  }
}

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
    params : {
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
      background = [0,0,0,255],
    },
    width,
    height,
    points,
    progressInterval = 1,
    qualityMode = 'high',
    defaultScale,
  } = data;
  return {
    attractorFn: attractor === "clifford" ? clifford : dejong,
    a, b, c, d, points, width, height, 
    scale: defaultScale * scale, 
    left, top, progressInterval, qualityMode, hue, saturation, brightness, background
  };
}

function runAttractorOffscreen({
  attractorFn,
  a, b, c, d,
  points, width, height, scale, left, top,
  progressInterval,
  qualityMode = 'high',
  hue, saturation, brightness, background
}: any) {

  let x = 0, y = 0;
  const pixels = new Uint32Array(width * height);
  let maxDensity = 0;
  const interval = Math.max(1, Math.floor(points * (progressInterval / 100)));
  const batchSize = qualityMode === 'low'
    ? Math.max(10000, Math.floor(points / 10))
    : Math.max(1000, Math.floor(points / 1000));
  let i = 0;
  shouldStop = false;

  function smoothing(num: number, scale: number) {
    return num + (Math.random() < 0.5 ? -0.2 : 0.2) * (1 / scale);
  }

  function drawPixels() {
    if (!offscreenCtx) return;
    const imageData = offscreenCtx.createImageData(width, height);
    const data = new Uint32Array(imageData.data.buffer);
    const bgArr = background;
    const bgColor = (bgArr[3] << 24) | (bgArr[2] << 16) | (bgArr[1] << 8) | bgArr[0];

    if (qualityMode === 'low') {
      
      for (let i = 0; i < pixels.length; i++) {
        const val = Number(pixels[i]) || 0;
        data[i] = val > 0 ? 0xffffffff : bgColor;
      }

    } else {
      for (let i = 0; i < pixels.length; i++) {
        const density = Number(pixels[i]) || 0;
        if (density > 0) {
          data[i] = getColorData(
            density,
            maxDensity,
            hue,
            saturation,
            brightness,
            1
          );
        } else {
          data[i] = bgColor;
        }
      }
    }
    offscreenCtx.putImageData(imageData, 0, 0);
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
        drawPixels();
        const progressVal = Math.round((i / points) * 100);
        const typeVal = i === points - 1 ? "done" : "preview";
        self.postMessage({
          type: typeVal,
          progress: progressVal,
          qualityMode: qualityMode,
        });
      }
    }
    if (i < points && !shouldStop) {
      rafHandle = self.requestAnimationFrame(processBatch);
    }
  }
  rafHandle = self.requestAnimationFrame(processBatch);
}

function runAttractor({
  attractorFn,
  a, b, c, d,
  points, width, height, scale, left, top,
  progressInterval,
  qualityMode = 'high',
}: any) {
  let x = 0, y = 0;
  const pixels = new Uint32Array(width * height);
  let maxDensity = 0;
  const interval = Math.max(1, Math.floor(points * (progressInterval / 100)));
  const batchSize = qualityMode === 'low'
    ? Math.max(10000, Math.floor(points / 10))
    : Math.max(1000, Math.floor(points / 1000));
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
          qualityMode,
          attractorParameters: parameters?.params
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
