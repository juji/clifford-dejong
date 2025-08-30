import type { ObservableAttractorData } from "./type";
import { clifford, dejong } from "@repo/core";
import {
  DEFAULT_SCALE,
  LOW_QUALITY_POINTS,
  LOW_QUALITY_INTERVAL,
} from "@/lib/constants";

import {
  calculateAttractorPoints,
  getBatchSize,
  getInterval,
} from "../shared/attractor-core";

export function lowQualityMode(
  data: ObservableAttractorData,
  onProgress: (percentComplete: number) => void = () => {},
) {
  // Implement low quality mode logic here
  console.log("low quality mode started", data);

  if (
    !data.canvas ||
    !data.canvasSize ||
    !data.attractorParameters ||
    !data.qualityMode
  ) {
    return () => {};
  }

  // implement low quality mode
  const { canvas, canvasSize, attractorParameters } = data;
  canvas.width = canvasSize.width;
  canvas.height = canvasSize.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};

  // Clear canvas
  ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

  // Set background
  const bgColor = attractorParameters.background;
  ctx.fillStyle = `rgba(${bgColor[0]}, ${bgColor[1]}, ${bgColor[2]}, ${bgColor[3]})`;
  ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

  // Get attractor function based on type
  const attractorFn =
    attractorParameters.attractor === "clifford" ? clifford : dejong;

  // Calculate points for low quality mode
  const points = LOW_QUALITY_POINTS;
  const scale = attractorParameters.scale * DEFAULT_SCALE;

  // Set up batch processing
  const batchSize = getBatchSize(points, "low");
  const interval = getInterval(points, LOW_QUALITY_INTERVAL);

  let animationFrameId: number;
  let isRunning = true;

  // Attractor point calculation
  const { processBatch } = calculateAttractorPoints({
    attractorFn,
    a: attractorParameters.a,
    b: attractorParameters.b,
    c: attractorParameters.c,
    d: attractorParameters.d,
    points,
    width: canvasSize.width,
    height: canvasSize.height,
    scale,
    left: attractorParameters.left,
    top: attractorParameters.top,
    batchSize,
    interval,
    onBatchProgress: (i, pixels, maxDensity, isDone) => {
      if (!isRunning) return;

      // Report progress to the caller
      const progressPercent = Math.min(100, Math.round((i / points) * 100));
      onProgress(progressPercent);

      // Create image data and render points
      const imageData = ctx.createImageData(
        canvasSize.width,
        canvasSize.height,
      );
      const data = imageData.data;

      // Render points based on density
      for (let i = 0; i < pixels.length; i++) {
        const density = pixels[i] || 0;
        if (density > 0) {
          // Calculate density ratio for brightness
          const densityRatio = Math.min(1, density / (maxDensity * 0.8));

          // Convert HSV to RGB for rendering
          const h = attractorParameters.hue;
          const s = attractorParameters.saturation;
          const v = attractorParameters.brightness * densityRatio;

          // Simple HSV to RGB conversion (could be improved for better color accuracy)
          const c = v * s;
          const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
          const m = v - c;

          let r = 0,
            g = 0,
            b = 0;

          if (h < 60) {
            r = c;
            g = x;
            b = 0;
          } else if (h < 120) {
            r = x;
            g = c;
            b = 0;
          } else if (h < 180) {
            r = 0;
            g = c;
            b = x;
          } else if (h < 240) {
            r = 0;
            g = x;
            b = c;
          } else if (h < 300) {
            r = x;
            g = 0;
            b = c;
          } else {
            r = c;
            g = 0;
            b = x;
          }

          const idx = i * 4;
          data[idx] = Math.floor((r + m) * 255);
          data[idx + 1] = Math.floor((g + m) * 255);
          data[idx + 2] = Math.floor((b + m) * 255);
          data[idx + 3] = 255; // Full opacity
        }
      }

      // Put image data to canvas
      ctx.putImageData(imageData, 0, 0);

      if (!isDone && isRunning) {
        // Continue processing in next animation frame
        animationFrameId = requestAnimationFrame(processBatch);
      }
    },
  });

  // Start the calculation process
  animationFrameId = requestAnimationFrame(processBatch);

  // return stop function
  return () => {
    // Stop any ongoing calculations
    isRunning = false;
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
  };
}
