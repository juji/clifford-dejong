'use client';

import { useRef, useEffect, useCallback } from "react";
import { useUIStore } from "@/store/ui-store";
import { useAttractorStore } from "@repo/state/attractor-store";
import { mainThreadDrawing } from "@/lib/main-thread-drawing";

import {
  DEFAULT_POINTS,
  DEFAULT_SCALE,
  LOW_QUALITY_POINTS,
  LOW_QUALITY_INTERVAL,
} from "@/lib/constants";

export function WorkerCanvas({ ariaLabel }: { ariaLabel?: string }) {
  const benchmarkResult = useUIStore((s) => s.benchmarkResult);
  const setProgress = useUIStore((s) => s.setProgress);
  const canvasSize = useUIStore((s) => s.canvasSize);
  const canvasVisible = useUIStore((s) => s.canvasVisible);
  const setOnInitResize = useUIStore((s) => s.setOnInitResize);
  const attractorParameters = useAttractorStore((s) => s.attractorParameters);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const setImageUrl = useUIStore((s) => s.setImageUrl);

  const handleWorkerMessage = useCallback((e: MessageEvent) => {
    const { type, pixels, maxDensity, progress, qualityMode, attractorParameters: params } = e.data;

    if(!canvasRef.current) return;
    if(!workerRef.current) return;
    if(!canvasSize) return;

    if(type === "ready") {
      workerRef.current.postMessage({
        type: "init",
        params: attractorParameters,
        width: canvasSize.width,
        height: canvasSize.height,
        progressInterval: qualityMode === "low" ? LOW_QUALITY_INTERVAL : 1,
        qualityMode,
        points: qualityMode === "low" ? LOW_QUALITY_POINTS : DEFAULT_POINTS,
        defaultScale: DEFAULT_SCALE,
      });
      return;
    }
    
    setProgress(progress);
    if(!progress){
      setImageUrl(null);
    }
    
    if ((type === "preview" || type === "done") && pixels && canvasRef.current && params) {
      mainThreadDrawing(
        canvasRef.current,
        pixels,
        maxDensity,
        progress,
        qualityMode,
        params
      );
    }

    if(type === "done" && canvasRef.current && qualityMode === "high") {
      setImageUrl(canvasRef.current.toDataURL("image/png"));
    }
  },[canvasSize])

  // handle parameters change
  useEffect(() => {
    if (!workerRef.current) return;
    workerRef.current?.postMessage({
      type: "update",
      params: attractorParameters,
    });
  },[ attractorParameters ])

  // when canvas size changes
  useEffect(() => {
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
    if (canvasVisible) {
      workerRef.current?.postMessage({
        type: "start",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qualityMode]);

  // initiate
  useEffect(() => {
    if (!benchmarkResult || !attractorParameters || !canvasSize) return;
    if (workerRef.current) return;

    const worker = new Worker(new URL("../../workers/attractor-worker.ts", import.meta.url), { type: "module" });
    workerRef.current = worker;

    worker.onmessage = handleWorkerMessage;
    setOnInitResize(() => {
      worker.postMessage({
        type: 'stop'
      })
    })

  }, [benchmarkResult, attractorParameters, canvasSize, handleWorkerMessage]);

  useEffect(() => {
    return () => {
      setOnInitResize(() => {})
      if(workerRef.current) {
        workerRef.current.terminate()
        workerRef.current = null
      }
    }
  },[])

  

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