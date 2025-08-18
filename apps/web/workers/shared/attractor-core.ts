/**
 * Shared attractor calculation functionality
 * Used by both standard and offscreen canvas workers
 */

import { AttractorFn } from "@repo/core";

export interface AttractorRunParams {
  attractorFn: AttractorFn;
  a: number;
  b: number;
  c: number;
  d: number;
  points: number;
  width: number;
  height: number;
  scale: number;
  left: number;
  top: number;
  progressInterval: number;
  qualityMode: string;
  hue?: number;
  saturation?: number;
  brightness?: number;
  background?: number[];
}

export interface PixelData {
  pixels: Uint32Array;
  maxDensity: number;
}

/**
 * Helper to determine batch size based on quality mode
 */
export function getBatchSize(points: number, qualityMode: string): number {
  return qualityMode === "low"
    ? Math.max(10000, Math.floor(points / 10))
    : Math.max(1000, Math.floor(points / 1000));
}

/**
 * Helper to calculate progress interval
 */
export function getInterval(points: number, progressInterval: number): number {
  return Math.max(1, Math.floor(points * (progressInterval / 100)));
}

/**
 * Smoothing function for attractor points
 */
export function smoothing(num: number, scale: number): number {
  return num + (Math.random() < 0.5 ? -0.2 : 0.2) * (1 / scale);
}

/**
 * Core attractor calculation function that generates point data
 * This is used by both regular and offscreen canvas workers
 */
export function calculateAttractorPoints({
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
  onBatchProgress,
}: {
  attractorFn: AttractorFn;
  a: number;
  b: number;
  c: number;
  d: number;
  points: number;
  width: number;
  height: number;
  scale: number;
  left: number;
  top: number;
  batchSize: number;
  interval: number;
  onBatchProgress: (
    i: number,
    pixels: Uint32Array,
    maxDensity: number,
    isDone: boolean,
  ) => void;
}): {
  processBatch: () => void;
  densityPixels: Uint32Array;
  maxDensity: number;
} {
  let x = Math.random() * 2 - 1; // Random start in range [-1, 1]
  let y = Math.random() * 2 - 1; // Random start in range [-1, 1]

  // console.log("initial", { x, y });
  // console.log("points", points);
  // console.log("interval", interval);

  const densityPixels = new Uint32Array(width * height);
  let maxDensity = 0;
  let i = 0;

  function processBatch() {
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
        densityPixels[idx] = (densityPixels[idx] || 0) + 1;
        if (densityPixels[idx] > maxDensity) maxDensity = densityPixels[idx];
      }

      if ((i > 0 && i % interval === 0) || i === points - 1) {
        onBatchProgress(i, densityPixels, maxDensity, i === points - 1);
      }
    }
  }

  return { processBatch, densityPixels, maxDensity };
}
