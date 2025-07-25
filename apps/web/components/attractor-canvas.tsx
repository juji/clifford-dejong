"use client";
import { useEffect, useRef, useState, useMemo } from "react";
import { runAttractorBenchmark } from "@/lib/attractor-benchmark";
import { useAttractorStore } from "@repo/state/attractor-store";
import { useAttractorWorker } from "@/hooks/use-attractor-worker";
import { mainThreadDrawing } from "@/lib/main-thread-drawing";
import { useUIStore } from "@/store/ui-store";
import { usePointerControl } from "@/hooks/use-pointer-control";
import { useParamsBackgroundColor } from "@/hooks/use-background-color-changer";
import {
  DEFAULT_POINTS,
  DEFAULT_SCALE,
  LOW_QUALITY_POINTS,
  LOW_QUALITY_INTERVAL,
} from "@/lib/constants";
import debounce from "debounce";
import type { AttractorParameters } from "@repo/core/types";

/**
 * Generates a descriptive label for the attractor visualization for screen readers
 */
function generateAttractorDescription(params: AttractorParameters): string {
  const {
    attractor = "unknown",
    a,
    b,
    c,
    d,
    hue,
    saturation,
    brightness,
  } = params;
  const attractorType = attractor
    ? attractor.charAt(0).toUpperCase() + attractor.slice(1)
    : "Unknown";

  return `An abstract geometric pattern generated with ${attractorType} attractor. Parameters: a=${a.toFixed(1)}, b=${b.toFixed(1)}, c=${c.toFixed(1)}, d=${d.toFixed(1)}. Colors: hue=${hue}°, saturation=${saturation}%, brightness=${brightness}%.`;
}

export function AttractorCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  usePointerControl(containerRef);

  // Use the hook to update the CSS variable when attractor background changes
  useParamsBackgroundColor();

  // Zustand selectors for attractor state
  const attractorParameters = useAttractorStore((s) => s.attractorParameters);
  const setProgress = useUIStore((s) => s.setProgress);
  const setImageUrl = useUIStore((s) => s.setImageUrl);
  const imageUrl = useUIStore((s) => s.imageUrl);
  const setError = useUIStore((s) => s.setError);

  // Generate accessible description for the attractor visualization
  const ariaLabel = useMemo(
    () => generateAttractorDescription(attractorParameters),
    [attractorParameters],
  );

  // State for rendering
  const [canvasSize, setCanvasSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [canvasVisible, setCanvasVisible] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const offscreenSupported = useRef(
    typeof window !== "undefined" &&
      typeof window.OffscreenCanvas !== "undefined",
  );
  const offscreenTransferredRef = useRef(false);
  const dynamicProgressIntervalRef = useRef<number | null>(null);
  const [workerReady, setWorkerReady] = useState(false);

  // initialize
  useEffect(() => {
    (async () => {
      // run benchmark on first render
      const result = await runAttractorBenchmark();
      let interval;
      if (result.msPer100k < 10) interval = 0.5;
      else if (result.msPer100k < 30) interval = 1;
      else interval = 2.5;
      dynamicProgressIntervalRef.current = interval;

      // this waits for benchmark to finish
      // before setting initial state
      // set default canvas size
      const canvas = canvasRef.current;
      if (canvas) {
        const parent = canvas.parentElement;
        if (parent) {
          const width = parent.clientWidth;
          const height = parent.clientHeight;
          canvas.width = width;
          canvas.height = height;
          setCanvasSize({ width, height });
        }
      }
    })();
  }, []);

  // Use custom worker hook
  const workerRef = useAttractorWorker({
    onReady: () => {
      setWorkerReady(true);
    },
    onLoadError: (error: string) => {
      setError(error || "Worker failed to load");
    },
    onPreview: (progress, e) => {
      if (progress === 0) setImageUrl(null);
      setProgress(progress);
      if (e.data.pixels && e.data.pixels.length > 0) {
        mainThreadDrawing(
          canvasRef.current,
          e.data.pixels,
          e.data.maxDensity,
          progress,
          e.data.qualityMode,
          e.data.attractorParameters,
        );
      }
    },
    onDone: (progress, e) => {
      setProgress(progress);
      if (e.data.pixels && e.data.pixels.length > 0) {
        mainThreadDrawing(
          canvasRef.current,
          e.data.pixels,
          e.data.maxDensity,
          progress,
          e.data.qualityMode,
          e.data.attractorParameters,
        );
      }
      const canvas = canvasRef.current;
      if (canvas && e.data.qualityMode === "high") {
        console.log("Attractor rendering completed with high quality.");
        setImageUrl(canvas.toDataURL("image/png"));
      }
    },
    onError: (error: string) => {
      setError(error || "Unknown error in worker");
    },
  });

  // Cleanup worker on unmount
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        workerRef.current.postMessage({ type: "stop" });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // qualityMode from store
  // update worker on quality mode change
  const qualityMode = useUIStore((s) => s.qualityMode);
  useEffect(() => {
    if (!workerRef.current) return;
    workerRef.current.postMessage({ type: "stop" });
    // on low quality mode change
    if (qualityMode === "low") {
      workerRef.current?.postMessage({
        type: "update",
        progressInterval: LOW_QUALITY_INTERVAL,
        points: LOW_QUALITY_POINTS,
        qualityMode: qualityMode,
      });
    } else {
      workerRef.current?.postMessage({
        type: "update",
        progressInterval: dynamicProgressIntervalRef.current,
        points: DEFAULT_POINTS,
        qualityMode: qualityMode,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qualityMode]);

  // Listen for window resize and update canvas size state
  const canvasVisibleRef = useRef(canvasVisible);
  useEffect(() => {
    // Debounced function for expensive resize logic
    const debouncedResize = debounce(
      (newSize: { width: number; height: number }) => {
        setCanvasSize(newSize);
        setTimeout(() => {
          setCanvasVisible(true);
          canvasVisibleRef.current = true;
        }, 100);
      },
      500,
    );

    function updateSize() {
      const canvas = canvasRef.current;
      const parent = canvas?.parentElement;
      if (!(canvas && parent)) return;
      const newSize = {
        width: parent.clientWidth,
        height: parent.clientHeight,
      };
      if (canvasVisibleRef.current) {
        setCanvasVisible(false);
        canvasVisibleRef.current = false;
        if (workerRef.current) workerRef.current.postMessage({ type: "stop" });
      }
      // Only update if size changed
      if (
        !canvasSize ||
        newSize.width !== canvasSize.width ||
        newSize.height !== canvasSize.height
      ) {
        debouncedResize(newSize);
      }
    }

    window.addEventListener("resize", updateSize);
    return () => {
      window.removeEventListener("resize", updateSize);
      if (typeof debouncedResize.clear === "function") {
        debouncedResize.clear();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasSize]);

  const workerInitiated = useRef(false);
  function initiateWorker() {
    // initiate everything
    setImageUrl(null);
    setError(null);
    setProgress(0);

    // sanity checks
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    if (!canvasSize) return;
    if (!workerRef.current) return;

    const width = canvasSize.width;
    const height = canvasSize.height;

    // setup canvas size
    // before OffscreenCanvas transfer
    if (!offscreenTransferredRef.current) {
      canvas.width = width;
      canvas.height = height;
    }

    // initialize offscreen canvas
    if (offscreenSupported && !offscreenTransferredRef.current) {
      const offscreen = canvas.transferControlToOffscreen();
      workerRef.current.postMessage(
        {
          type: "init",
          canvas: offscreen,
          width,
          height,
          params: attractorParameters,
          progressInterval: dynamicProgressIntervalRef.current,
          points: DEFAULT_POINTS,
          defaultScale: DEFAULT_SCALE,
          qualityMode: qualityMode,
        },
        [offscreen],
      );
      offscreenTransferredRef.current = true;
    } else {
      workerRef.current.postMessage({
        type: "init",
        width,
        height,
        params: attractorParameters,
        progressInterval: dynamicProgressIntervalRef.current,
        points: DEFAULT_POINTS,
        defaultScale: DEFAULT_SCALE,
        qualityMode: qualityMode,
      });
    }
  }

  // when canvas size changes
  useEffect(() => {
    if (!workerInitiated.current) return;
    if (!canvasSize) return;
    workerRef.current?.postMessage({
      type: "resize",
      width: canvasSize?.width,
      height: canvasSize?.height,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasSize]);

  // canvas visibility change
  useEffect(() => {
    if (!workerInitiated.current) return;
    if (canvasVisible) {
      workerRef.current?.postMessage({
        type: "start",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasVisible]);

  // after initialized
  // or attractor parameters change
  useEffect(() => {
    if (!initialized) return;
    else if (!workerInitiated.current) {
      initiateWorker();
      workerInitiated.current = true;
    } else
      workerRef.current?.postMessage({
        type: "update",
        params: attractorParameters,
      });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized, attractorParameters]);

  // set initialized state
  // when canvasSize is available
  // and worker is ready
  useEffect(() => {
    if (canvasSize && workerReady) {
      setInitialized(true);
    }
  }, [canvasSize, workerReady]);

  return (
    <div
      className={`flex items-center justify-center w-full h-full fixed top-0 left-0 ${canvasVisible ? "opacity-100" : "opacity-0"}`}
      ref={containerRef}
      style={
        {
          backgroundColor: "var(--cda-bg-canvas)",
        } as React.CSSProperties
      }
    >
      {/* this is for safari */}
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl || ""}
          alt=""
          aria-hidden="true"
          role="presentation"
          className="absolute inset-0 w-full h-full object-contain"
          style={{ touchAction: "none" }}
        />
      ) : null}
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={ariaLabel}
        style={{ touchAction: "none" }}
        className={`block w-full h-full transition-opacity`}
      />
    </div>
  );
}
