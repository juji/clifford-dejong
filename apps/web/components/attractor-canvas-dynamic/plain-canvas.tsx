"use client";

import { useRef, useEffect, useCallback } from "react";
import { useUIStore } from "@/store/ui-store";
import { useAttractorStore } from "@repo/state/attractor-store";
import { mainThreadDrawing } from "@/lib/main-thread-drawing";
import {
  calculateAttractorPoints,
  getBatchSize,
  getInterval,
} from "../../workers/shared/attractor-core";
import {
  DEFAULT_POINTS,
  DEFAULT_SCALE,
  LOW_QUALITY_POINTS,
  LOW_QUALITY_INTERVAL,
} from "@/lib/constants";
import { clifford, dejong } from "@repo/core";

type PlainAttractorParams = {
  attractorFn: typeof clifford | typeof dejong;
  a: number;
  b: number;
  c: number;
  d: number;
  width: number;
  height: number;
  scale: number;
  left: number;
  top: number;
  points: number;
  progressInterval: number;
  qualityMode: string;
  hue: number;
  saturation: number;
  brightness: number;
  background: [number, number, number, number];
};

export function PlainCanvas({ ariaLabel }: { ariaLabel?: string }) {
  const benchmarkResult = useUIStore((s) => s.benchmarkResult);
  const setProgress = useUIStore((s) => s.setProgress);
  const canvasSize = useUIStore((s) => s.canvasSize);
  const setOnInitResize = useUIStore((s) => s.setOnInitResize);
  const attractorParameters = useAttractorStore((s) => s.attractorParameters);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const setImageUrl = useUIStore((s) => s.setImageUrl);
  const qualityMode = useUIStore((s) => s.qualityMode);

  // Main thread calculation and drawing
  const rafId = useRef<number | null>(null);
  const runAttractor = useCallback(
    (params: PlainAttractorParams) => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
      if (!canvasRef.current || !params) return;
      const points = params.points;
      const batchSize = getBatchSize(points, params.qualityMode);
      const interval = getInterval(points, params.progressInterval);
      let lastProgress = 0;
      let done = false;
      setProgress(0);
      setImageUrl(null);

      const { processBatch } = calculateAttractorPoints({
        ...params,
        batchSize,
        interval,
        onBatchProgress: (idx, densityPixels, maxDensity, isDone) => {
          const progress = Math.round((idx / (points - 1)) * 100);
          setProgress(progress);
          if ((progress !== lastProgress || isDone) && canvasRef.current) {
            mainThreadDrawing(
              canvasRef.current,
              densityPixels,
              maxDensity,
              progress,
              params.qualityMode,
              attractorParameters,
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
    },
    [setProgress, setImageUrl, attractorParameters],
  );

  useEffect(() => {
    if (!benchmarkResult || !attractorParameters || !canvasSize) return;
    const params: PlainAttractorParams = {
      attractorFn:
        attractorParameters.attractor === "clifford" ? clifford : dejong,
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
