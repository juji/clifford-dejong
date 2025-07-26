'use client';

import { useRef, useEffect, useCallback } from "react";
import { useUIStore } from "@/store/ui-store";
import { useAttractorStore } from "@repo/state/attractor-store";
import { mainThreadDrawing } from "@/lib/main-thread-drawing";
import {
  calculateAttractorPoints,
  getBatchSize,
  getInterval
} from "../../workers/shared/attractor-core";
import {
  DEFAULT_POINTS,
  DEFAULT_SCALE,
  LOW_QUALITY_POINTS,
  LOW_QUALITY_INTERVAL,
} from "@/lib/constants";

export function PlainCanvas({ ariaLabel }: { ariaLabel?: string }) {
  const benchmarkResult = useUIStore((s) => s.benchmarkResult);
  const setProgress = useUIStore((s) => s.setProgress);
  const canvasSize = useUIStore((s) => s.canvasSize);
  const canvasVisible = useUIStore((s) => s.canvasVisible);
  const setOnInitResize = useUIStore((s) => s.setOnInitResize);
  const attractorParameters = useAttractorStore((s) => s.attractorParameters);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const setImageUrl = useUIStore((s) => s.setImageUrl);
  const qualityMode = useUIStore((s) => s.qualityMode);

  // Main thread calculation and drawing
  const rafId = useRef<number | null>(null);
  const runAttractor = useCallback((params: any) => {
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
    if (!canvasRef.current || !params) return;
    const width = params.width;
    const height = params.height;
    const points = params.points;
    const batchSize = getBatchSize(points, params.qualityMode);
    const interval = getInterval(points, params.progressInterval);
    let lastProgress = 0;
    let done = false;
    setProgress(0);
    setImageUrl(null);

    const { processBatch, pixels, maxDensity } = calculateAttractorPoints({
      ...params,
      batchSize,
      interval,
      onBatchProgress: (idx, pxs, maxD, isDone) => {
        const progress = Math.round((idx / (points - 1)) * 100);
        setProgress(progress);
        if ((progress !== lastProgress || isDone) && canvasRef.current) {
          mainThreadDrawing(
            canvasRef.current,
            Array.from(pxs),
            maxD,
            progress,
            params.qualityMode,
            params.params
          );
          lastProgress = progress;
        }
        if (isDone && canvasRef.current && params.qualityMode === "high") {
          setImageUrl(canvasRef.current.toDataURL("image/png"));
          done = true;
        }
      },
    });

    function step() {
      if (done) return;
      processBatch();
      if (!done && lastProgress < 100) {
        rafId.current = requestAnimationFrame(step);
      }
    }
    rafId.current = requestAnimationFrame(step);
  }, [setProgress, setImageUrl]);

  // Re-run on parameter/size/quality changes
  useEffect(() => {
    if (!benchmarkResult || !attractorParameters || !canvasSize) return;
    const params = {
      attractorFn: attractorParameters.attractor === "clifford" ? require("@repo/core").clifford : require("@repo/core").dejong,
      a: attractorParameters.a,
      b: attractorParameters.b,
      c: attractorParameters.c,
      d: attractorParameters.d,
      width: canvasSize.width,
      height: canvasSize.height,
      scale: DEFAULT_SCALE * (attractorParameters.scale ?? 1),
      left: attractorParameters.left,
      top: attractorParameters.top,
      points: qualityMode === "low" ? LOW_QUALITY_POINTS : DEFAULT_POINTS,
      progressInterval: qualityMode === "low" ? LOW_QUALITY_INTERVAL : 1,
      qualityMode,
      hue: attractorParameters.hue,
      saturation: attractorParameters.saturation,
      brightness: attractorParameters.brightness,
      background: attractorParameters.background,
      params: attractorParameters,
    };
    runAttractor(params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [benchmarkResult, attractorParameters, canvasSize, qualityMode]);

  useEffect(() => {
    setOnInitResize(() => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
    });
    return () => {
      setOnInitResize(() => {});
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return benchmarkResult && canvasSize ? (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={ariaLabel}
      width={canvasSize.width}
      height={canvasSize.height}
      style={{ touchAction: "none" }}
      className={`block w-full h-full transition-opacity`}
    />
  ) : null;
}