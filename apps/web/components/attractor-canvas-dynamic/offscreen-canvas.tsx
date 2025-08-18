"use client";

import { useRef, useEffect, useCallback } from "react";
import { useUIStore } from "@/store/ui-store";
import { useAttractorStore } from "@repo/state/attractor-store";

import {
  DEFAULT_POINTS,
  DEFAULT_SCALE,
  LOW_QUALITY_POINTS,
  LOW_QUALITY_INTERVAL,
} from "@/lib/constants";

export function OffscreenCanvas({ ariaLabel }: { ariaLabel?: string }) {
  const benchmarkResult = useUIStore((s) => s.benchmarkResult);
  const setProgress = useUIStore((s) => s.setProgress);
  const canvasSize = useUIStore((s) => s.canvasSize);
  const canvasVisible = useUIStore((s) => s.canvasVisible);
  const setOnInitResize = useUIStore((s) => s.setOnInitResize);
  const attractorParameters = useAttractorStore((s) => s.attractorParameters);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const setImageUrl = useUIStore((s) => s.setImageUrl);
  const timeRef = useRef<number | null>(null);

  const handleWorkerMessage = useCallback(
    (e: MessageEvent) => {
      const { type, progress, qualityMode } = e.data;
      if (!canvasRef.current) return;
      if (!workerRef.current) return;
      if (!canvasSize) return;

      if (type === "ready") {
        const canvas = canvasRef.current;
        const offscreen = canvas.transferControlToOffscreen();
        timeRef.current = performance.now();
        workerRef.current.postMessage(
          {
            type: "init",
            canvas: offscreen,
            width: canvasSize.width,
            height: canvasSize.height,
            params: attractorParameters,
            progressInterval: qualityMode === "low" ? LOW_QUALITY_INTERVAL : 1,
            qualityMode,
            points: qualityMode === "low" ? LOW_QUALITY_POINTS : DEFAULT_POINTS,
            defaultScale: DEFAULT_SCALE,
          },
          [offscreen],
        );
        return;
      }

      setProgress(progress);
      if (!progress) {
        setImageUrl(null);
      }

      if (type === "done" && canvasRef.current && qualityMode === "high") {
        setImageUrl(canvasRef.current.toDataURL("image/png"));
        const time = performance.now() - (timeRef.current || 0);
        console.log("OffscreenCanvas draw time:", time, "ms");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canvasSize],
  );

  // handle parameters change
  useEffect(() => {
    if (!workerRef.current) return;
    workerRef.current?.postMessage({
      type: "update",
      params: attractorParameters,
    });
  }, [attractorParameters]);

  // when canvas size changes
  useEffect(() => {
    if (!canvasSize) return;
    workerRef.current?.postMessage({
      type: "resize",
      width: canvasSize?.width,
      height: canvasSize?.height,
    });
  }, [canvasSize]);

  // canvas visibility change
  useEffect(() => {
    if (canvasVisible) {
      workerRef.current?.postMessage({
        type: "start",
      });
    }
  }, [canvasVisible]);

  // qualityMode from store
  // update worker on quality mode change
  const qualityMode = useUIStore((s) => s.qualityMode);
  useEffect(() => {
    if (!workerRef.current) return;
    workerRef.current?.postMessage({
      type: "update",
      progressInterval: qualityMode === "low" ? LOW_QUALITY_INTERVAL : 1,
      points: qualityMode === "low" ? LOW_QUALITY_POINTS : DEFAULT_POINTS,
      qualityMode,
    });
  }, [qualityMode]);

  // initiate
  useEffect(() => {
    if (!benchmarkResult || !attractorParameters || !canvasSize) return;
    if (workerRef.current) return;
    if (!canvasRef.current) return;

    const worker = new Worker(
      new URL("../../workers/attractor-worker-offscreen.ts", import.meta.url),
      { type: "module" },
    );
    workerRef.current = worker;

    worker.onmessage = handleWorkerMessage;
    setOnInitResize(() => {
      worker.postMessage({
        type: "stop",
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [benchmarkResult, attractorParameters, canvasSize, handleWorkerMessage]);

  useEffect(() => {
    return () => {
      setOnInitResize(() => {});
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
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
