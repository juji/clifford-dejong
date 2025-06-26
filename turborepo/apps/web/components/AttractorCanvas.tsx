"use client";
import { useEffect, useRef } from "react";
import { clifford, dejong } from "@repo/core";
import { getColorData } from "@repo/core/color";
import type { CanvasProps, CanvasOptions } from "@repo/core/canvas-types";

const DEFAULT_OPTIONS: CanvasOptions = {
  attractor: "clifford",
  a: 2,
  b: -2,
  c: 1,
  d: -1,
  hue: 333,
  saturation: 100,
  brightness: 100,
  background: [0, 0, 0],
  scale: 1,
  left: 0,
  top: 0,
};

const DEFAULT_POINTS = 20000000;
const DEFAULT_SCALE = 150;

function smoothing(num: number, scale: number) {
  return num + (Math.random() < 0.5 ? -0.2 : 0.2) * (1 / scale);
}

export function AttractorCanvas({
  options = DEFAULT_OPTIONS,
  onProgress,
  onImageReady,
}: Partial<CanvasProps>) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
    const width = canvas.width;
    const height = canvas.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Legacy scaling and centering
    const scale = DEFAULT_SCALE;
    const scaleRatio = Math.max(0.001, opts.scale ?? 1);
    const centerXRatio = opts.left ?? 0;
    const centerYRatio = opts.top ?? 0;
    const centerX = width - width / 2 + centerXRatio * width;
    const centerY = height - height / 2 + centerYRatio * height;

    // Density buffer
    const pixels = new Uint32Array(width * height);
    let maxDensity = 0;
    let x = 0,
      y = 0;
    const attractorFn = opts.attractor === "clifford" ? clifford : dejong;
    for (let i = 0; i < DEFAULT_POINTS; i++) {
      const result = attractorFn(x, y, opts.a, opts.b, opts.c, opts.d);
      const nx =
        Array.isArray(result) && typeof result[0] === "number"
          ? result[0]
          : 0;
      const ny =
        Array.isArray(result) && typeof result[1] === "number"
          ? result[1]
          : 0;
      x = smoothing(nx, scale * scaleRatio);
      y = smoothing(ny, scale * scaleRatio);
      const screenX = Math.round(x * scale * scaleRatio);
      const screenY = Math.round(y * scale * scaleRatio);
      const px = Math.floor(screenX + centerX);
      const py = Math.floor(screenY + centerY);
      if (px >= 0 && px < width && py >= 0 && py < height) {
        const idx = px + py * width;
        pixels[idx] = (pixels[idx] || 0) + 1;
        if (pixels[idx] > maxDensity) maxDensity = pixels[idx];
      }
    }

    // Color mapping
    const imageData = ctx.createImageData(width, height);
    const data = new Uint32Array(imageData.data.buffer);
    const bgArr = opts.background ?? [0, 0, 0];
    const bgColor =
      (255 << 24) | (bgArr[2] << 16) | (bgArr[1] << 8) | bgArr[0];
    for (let i = 0; i < pixels.length; i++) {
      const density = pixels[i] ?? 0;
      if (density > 0) {
        data[i] = getColorData(
          density,
          maxDensity,
          opts.hue ?? 120,
          opts.saturation ?? 100,
          opts.brightness ?? 100
        );
      } else {
        data[i] = bgColor;
      }
    }
    ctx.putImageData(imageData, 0, 0);

    if (onImageReady) {
      onImageReady(canvas.toDataURL("image/png"));
    }
    if (onProgress) {
      onProgress(100);
    }
  }, [opts, onProgress, onImageReady]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}
