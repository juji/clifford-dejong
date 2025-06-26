"use client";
import { useEffect, useRef, useState } from "react";
import { getColorData } from "@repo/core/color";
import { runAttractorBenchmark } from "../lib/attractor-benchmark";
import { useAttractorStore } from '../../../packages/state/attractor-store';

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
  onProgress,
  onImageReady,
  progressInterval,
}: {
  onProgress?: (progress: number) => void;
  onImageReady?: (url: string) => void;
  progressInterval?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Zustand selectors for all attractor state
  const attractor = useAttractorStore((s) => s.attractor);
  const a = useAttractorStore((s) => s.a);
  const b = useAttractorStore((s) => s.b);
  const c = useAttractorStore((s) => s.c);
  const d = useAttractorStore((s) => s.d);
  const hue = useAttractorStore((s) => s.hue);
  const saturation = useAttractorStore((s) => s.saturation);
  const brightness = useAttractorStore((s) => s.brightness);
  const background = useAttractorStore((s) => s.background);
  const scale = useAttractorStore((s) => s.scale);
  const left = useAttractorStore((s) => s.left);
  const top = useAttractorStore((s) => s.top);
  const setProgress = useAttractorStore((s) => s.setProgress);
  const setIsRendering = useAttractorStore((s) => s.setIsRendering);
  const setImageUrl = useAttractorStore((s) => s.setImageUrl);
  const setError = useAttractorStore((s) => s.setError);
  const DEFAULT_POINTS = useAttractorStore((s) => s.DEFAULT_POINTS);
  const DEFAULT_SCALE = useAttractorStore((s) => s.DEFAULT_SCALE);
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
    setIsRendering(true);
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
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    const interval = dynamicProgressInterval ?? progressInterval ?? 1;
    const worker = new Worker(new URL('../workers/AttractorWorker.ts', import.meta.url), { type: 'module' });
    workerRef.current = worker;
    worker.postMessage({
      attractor,
      a,
      b,
      c,
      d,
      points: DEFAULT_POINTS,
      width,
      height,
      scale: DEFAULT_SCALE * (scale ?? 1),
      left: left ?? 0,
      top: top ?? 0,
      hue,
      saturation,
      brightness,
      background,
      progressInterval: interval
    });
    worker.onmessage = (e: MessageEvent) => {
      if (e.data.type === 'stopped') {
        setIsRendering(false);
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
        const bgArr = background;
        const bgColor = (bgArr[3] << 24) | (bgArr[2] << 16) | (bgArr[1] << 8) | bgArr[0];
        for (let i = 0; i < pixels.length; i++) {
          const density = pixels[i] ?? 0;
          if (density > 0) {
            data[i] = getColorData(
              density,
              maxDensity,
              hue ?? 120,
              saturation ?? 100,
              brightness ?? 100
            );
          } else {
            data[i] = bgColor;
          }
        }
        ctx.putImageData(imageData, 0, 0);
        if (e.data.type === 'done') {
          setIsRendering(false);
          setImageUrl(canvas.toDataURL("image/png"));
          if (onImageReady) onImageReady(canvas.toDataURL("image/png"));
        }
        if (typeof progress === 'number') {
          setProgress(progress);
          if (onProgress) onProgress(progress);
        }
      } else if (e.data.type === 'error') {
        setIsRendering(false);
        setError(e.data.error || 'Unknown error in worker');
      }
    };
    // Cleanup function to terminate the worker on unmount
    return () => {
      setIsRendering(false);
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [benchmarkReady, debouncedCanvasSize, dynamicProgressInterval, progressInterval, attractor, a, b, c, d, hue, saturation, brightness, background, left, top, setError, setImageUrl, setIsRendering, setProgress, onImageReady, onProgress, DEFAULT_POINTS, DEFAULT_SCALE]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />;
}
