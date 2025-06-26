"use client";
import { useEffect, useRef, useState } from "react";
import { clifford, dejong } from "@repo/core";
import { getColorData } from "@repo/core/color";
import type { CanvasProps, CanvasOptions } from "@repo/core/canvas-types";
import { runAttractorBenchmark } from "../lib/attractor-benchmark";

const DEFAULT_OPTIONS: CanvasOptions = {
  attractor: "clifford",
  a: 2,
  b: -2,
  c: 1,
  d: -1,
  hue: 333,
  saturation: 100,
  brightness: 100,
  background: [0, 0, 0, 255],
  scale: 1,
  left: 0,
  top: 0,
};

const DEFAULT_POINTS = 20000000;
const DEFAULT_SCALE = 150;

function smoothing(num: number, scale: number) {
  return num + (Math.random() < 0.5 ? -0.2 : 0.2) * (1 / scale);
}

// Calculate preview opacity based on percent progress
function getPreviewOpacity(percent: number): number {
  // Multi-peak smooth wave, always ends at 1.0
  const progress = percent / 100;
  if (percent >= 100) return 1.0;
  // 2.5 cycles, amplitude fades as progress increases, bias toward 1.0
  const wave = 0.5 * Math.sin(2.5 * Math.PI * progress) * (1 - progress) + progress;
  return Math.max(0, Math.min(1, wave));
}

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

/**
 * AttractorCanvas
 *
 * This React component renders the attractor using an off-main-thread Web Worker.
 *
 * - Runs a device benchmark on mount (unless progressInterval is provided).
 * - Sets progressInterval (percent) dynamically based on device speed:
 *     - Fast device: smaller interval (more frequent updates, smoother UI)
 *     - Slow device: larger interval (fewer updates, less UI overhead)
 * - Sends progressInterval to the worker, which controls how often the worker posts progress updates.
 * - Receives preview/done/error messages from the worker and updates the canvas.
 *
 * Why progressInterval?
 *   - Too many updates: UI is smooth but can lag on slow devices.
 *   - Too few updates: UI is responsive but animation is choppy.
 *   - Dynamic tuning gives best experience for all users.
 */
export function AttractorCanvas({
  options = DEFAULT_OPTIONS,
  onProgress,
  onImageReady,
  progressInterval,
}: Partial<CanvasProps> & { progressInterval?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [dynamicProgressInterval, setDynamicProgressInterval] = useState<number | null>(null);
  const [benchmarkReady, setBenchmarkReady] = useState(false);
  const [canvasSize, setCanvasSize] = useState<{ width: number; height: number } | null>(null);
  const debouncedCanvasSize = useDebouncedValue(canvasSize, 200); // 200ms debounce
  const workerRef = useRef<Worker | null>(null);

  // Listen for window resize and update canvas size state
  useEffect(() => {
    let lastSize = { width: 0, height: 0 };
    const HEIGHT_THRESHOLD = 40; // px, ignore small height changes (e.g. mobile scroll)
    function updateSize() {
      const canvas = canvasRef.current;
      const parent = canvas?.parentElement;
      if (canvas && parent) {
        const newSize = { width: parent.clientWidth, height: parent.clientHeight };
        const heightDelta = Math.abs(newSize.height - lastSize.height);
        if (newSize.width !== lastSize.width) {
          if (workerRef.current) workerRef.current.postMessage({ type: 'stop' });
          lastSize = newSize;
          setCanvasSize(newSize);
        } else if (heightDelta > HEIGHT_THRESHOLD) {
          if (workerRef.current) workerRef.current.postMessage({ type: 'stop' });
          lastSize = newSize;
          setCanvasSize(newSize);
        }
        // No log for minor height changes
      }
    }
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    if (progressInterval == null) {
      const result = runAttractorBenchmark();
      let interval;
      if (result.msPer100k < 10) interval = 0.5; // 0.5% (200 batches)
      else if (result.msPer100k < 30) interval = 1; // 1% (100 batches)
      else interval = 2.5; // 2.5% (40 batches)
      setDynamicProgressInterval(interval);
      setBenchmarkReady(true);
    } else {
      setBenchmarkReady(true);
    }
  }, [progressInterval]);

  useEffect(() => {
    if (!benchmarkReady) return;
    setError(null);
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const width = debouncedCanvasSize?.width ?? parent.clientWidth;
    const height = debouncedCanvasSize?.height ?? parent.clientHeight;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Terminate any previous worker before starting a new one
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }

    const interval = dynamicProgressInterval ?? progressInterval ?? 1;
    const worker = new Worker(new URL('../workers/AttractorWorker.ts', import.meta.url), { type: 'module' });
    workerRef.current = worker;
    worker.postMessage({
      attractor: opts.attractor,
      a: opts.a,
      b: opts.b,
      c: opts.c,
      d: opts.d,
      points: DEFAULT_POINTS,
      width,
      height,
      scale: DEFAULT_SCALE * (opts.scale ?? 1),
      left: opts.left ?? 0,
      top: opts.top ?? 0,
      progressInterval: interval
    });
    worker.onmessage = (e: MessageEvent) => {
      if (e.data.type === 'stopped') {
        if (workerRef.current) {
          workerRef.current.terminate();
          workerRef.current = null;
        }
        return;
      }
      if ((e.data.type === 'preview' || e.data.type === 'done') && e.data.pixels) {
        const { pixels, maxDensity, progress } = e.data;
        const imageData = ctx.createImageData(width, height);
        const data = new Uint32Array(imageData.data.buffer);
        const bgArr = opts.background ?? DEFAULT_OPTIONS.background;
        const bgColor = (bgArr[3] << 24) | (bgArr[2] << 16) | (bgArr[1] << 8) | bgArr[0];
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
        if (e.data.type === 'done' && onImageReady) {
          onImageReady(canvas.toDataURL("image/png"));
        }
        if (onProgress && typeof progress === 'number') {
          onProgress(progress);
        }
      } else if (e.data.type === 'error') {
        setError(e.data.error || 'Unknown error in worker');
      }
    };
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, [options, onProgress, onImageReady, progressInterval, dynamicProgressInterval, benchmarkReady, debouncedCanvasSize]);

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block"
        }}
      />
      {error && (
        <div style={{ color: 'red', position: 'absolute', top: 0, left: 0, background: 'rgba(0,0,0,0.7)', padding: 8, zIndex: 10 }}>
          Error: {error}
        </div>
      )}
    </>
  );
}
