"use client";
import { useEffect, useRef, useState } from "react";
import { getColorData } from "@repo/core/color";
import { runAttractorBenchmark } from "../lib/attractor-benchmark";
import { useAttractorStore } from "../../../packages/state/attractor-store";
import { useUIStore } from "../store/ui-store";

function ModeToggleButton({
  mode,
  onToggle,
}: {
  mode: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className="fixed bottom-6 right-6 z-[201] px-4 py-2 rounded bg-background border border-foreground shadow text-foreground text-xs font-semibold hover:bg-foreground hover:text-background transition-colors"
      onClick={onToggle}
      aria-label="Toggle quality mode"
    >
      {mode === "high" ? "Low Quality" : "High Quality"}
    </button>
  );
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
export function AttractorCanvas() {
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
  const LOW_QUALITY_POINTS = useAttractorStore((s) => s.LOW_QUALITY_POINTS);
  const LOW_QUALITY_INTERVAL = useAttractorStore((s) => s.LOW_QUALITY_INTERVAL);
  const [dynamicProgressInterval, setDynamicProgressInterval] = useState<number | null>(null);
  const [canvasSize, setCanvasSize] = useState<{ width: number; height: number } | null>(null);
  const debouncedCanvasSize = useDebouncedValue(canvasSize, 200); // 200ms debounce
  const workerRef = useRef<Worker | null>(null);
  // Move qualityMode to Zustand UI store
  const qualityMode = useUIStore((s) => s.qualityMode);
  const setQualityMode = useUIStore((s) => s.setQualityMode);

  // Create the worker only once on mount
  useEffect(() => {
    const worker = new Worker(
      new URL("../workers/attractor-worker.ts", import.meta.url),
      { type: "module" },
    );
    workerRef.current = worker;
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  // Listen for window resize and update canvas size state
  useEffect(() => {
    let lastSize = { width: 0, height: 0 };
    const HEIGHT_THRESHOLD = 40; // px, ignore small height changes (e.g. mobile scroll)
    function updateSize() {
      const canvas = canvasRef.current;
      const parent = canvas?.parentElement;
      if (canvas && parent) {
        const newSize = {
          width: parent.clientWidth,
          height: parent.clientHeight,
        };
        const heightDelta = Math.abs(newSize.height - lastSize.height);
        if (newSize.width !== lastSize.width) {
          if (workerRef.current)
            workerRef.current.postMessage({ type: "stop" });
          lastSize = newSize;
          setCanvasSize(newSize);
        } else if (heightDelta > HEIGHT_THRESHOLD) {
          if (workerRef.current)
            workerRef.current.postMessage({ type: "stop" });
          lastSize = newSize;
          setCanvasSize(newSize);
        }
      }
    }
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    // Always benchmark and set dynamicProgressInterval on mount
    if (qualityMode === 'low') {
      setDynamicProgressInterval(LOW_QUALITY_INTERVAL);
    } else {
      const result = runAttractorBenchmark();
      let interval;
      if (result.msPer100k < 10)
        interval = 0.5;
      else if (result.msPer100k < 30)
        interval = 1;
      else interval = 2.5;
      setDynamicProgressInterval(interval);
    }
  }, [qualityMode, LOW_QUALITY_INTERVAL]);

  // Reuse the worker: send new params instead of recreating
  useEffect(() => {
    if (dynamicProgressInterval == null) return;
    setError(null);
    setIsRendering(true);
    setProgress(0);
    const debounceId = setTimeout(() => {
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
      const interval = dynamicProgressInterval;
      if (workerRef.current) {
        // Stop any previous computation
        workerRef.current.postMessage({ type: "stop" });
        // Set up message handler
        workerRef.current.onmessage = (e: MessageEvent) => {
          if (e.data.type === "stopped") {
            setIsRendering(false);
            return;
          }
          if (
            (e.data.type === "preview" || e.data.type === "done") &&
            e.data.pixels
          ) {
            const { pixels, maxDensity, progress } = e.data;
            const imageData = ctx.createImageData(width, height);
            const data = new Uint32Array(imageData.data.buffer);
            const bgArr = background;
            const bgColor =
              (bgArr[3] << 24) | (bgArr[2] << 16) | (bgArr[1] << 8) | bgArr[0];

            if (qualityMode === 'low') {
              // Fast fill: just set all nonzero pixels to white, others to bg
              for (let i = 0; i < pixels.length; i++) {
                data[i] = pixels[i] > 0 ? 0xffffffff : bgColor;
              }
            } else {
              for (let i = 0; i < pixels.length; i++) {
                const density = pixels[i] ?? 0;
                if (density > 0) {
                  data[i] = getColorData(
                    density,
                    maxDensity,
                    hue ?? 120,
                    saturation ?? 100,
                    brightness ?? 100,
                    progress > 0 ? progress / 100 : 1,
                  );
                } else {
                  data[i] = bgColor;
                }
              }
            }

            ctx.putImageData(imageData, 0, 0);
            if (e.data.type === "done") {
              setIsRendering(false);
              setImageUrl(canvas.toDataURL("image/png"));
            }
            if (typeof progress === "number") {
              setProgress(progress);
            }
          } else if (e.data.type === "error") {
            setIsRendering(false);
            setError(e.data.error || "Unknown error in worker");
          }
        };
        // Start new computation
        workerRef.current.postMessage({
          attractor,
          a,
          b,
          c,
          d,
          points: qualityMode === 'low' ? LOW_QUALITY_POINTS : DEFAULT_POINTS,
          width,
          height,
          scale: DEFAULT_SCALE * (scale ?? 1),
          left: left ?? 0,
          top: top ?? 0,
          hue,
          saturation,
          brightness,
          background,
          progressInterval: interval,
          qualityMode, // pass to worker
        });
      }
    }, 100); // 100ms debounce after setProgress(0)
    // Cleanup function to clear debounce only
    return () => {
      clearTimeout(debounceId);
      setIsRendering(false);
    };
  }, [
    dynamicProgressInterval,
    debouncedCanvasSize,
    attractor,
    a,
    b,
    c,
    d,
    hue,
    saturation,
    brightness,
    background,
    left,
    top,
    scale,
    DEFAULT_POINTS,
    DEFAULT_SCALE,
    setError,
    setImageUrl,
    setIsRendering,
    setProgress,
    LOW_QUALITY_POINTS,
    qualityMode,
  ]);

  return (
    <>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />
      <ModeToggleButton mode={qualityMode} onToggle={() => setQualityMode(qualityMode === 'high' ? 'low' : 'high')} />
    </>
  );
}
