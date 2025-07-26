'use client';

import { useRef, useEffect, useCallback } from "react";
import { useUIStore } from "@/store/ui-store";
import { useAttractorStore } from "@repo/state/attractor-store";
// No mainThreadDrawing: worker sends RGBA pixel data, main thread just blits

import {
  DEFAULT_POINTS,
  DEFAULT_SCALE,
  LOW_QUALITY_POINTS,
  LOW_QUALITY_INTERVAL,
} from "@/lib/constants";

export function SharedArrayCanvas({ ariaLabel }: { ariaLabel?: string }) {
  const benchmarkResult = useUIStore((s) => s.benchmarkResult);
  const setProgress = useUIStore((s) => s.setProgress);
  const canvasSize = useUIStore((s) => s.canvasSize);
  const canvasVisible = useUIStore((s) => s.canvasVisible);
  const setOnInitResize = useUIStore((s) => s.setOnInitResize);
  const attractorParameters = useAttractorStore((s) => s.attractorParameters);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const setImageUrl = useUIStore((s) => s.setImageUrl);
  const sharedBufferRef = useRef<SharedArrayBuffer | null>(null);

  const handleWorkerMessage = useCallback((e: MessageEvent) => {
    const { type, progress, qualityMode, attractorParameters: params, width, height } = e.data;

    if(!canvasRef.current) return;
    if(!workerRef.current) return;
    if(!canvasSize) return;

    if(type === "ready") {
      // Create or resize the shared buffer
      const pixelCount = canvasSize.width * canvasSize.height;
      sharedBufferRef.current = new SharedArrayBuffer(pixelCount * Uint32Array.BYTES_PER_ELEMENT);
      workerRef.current.postMessage({
        type: "init",
        params: attractorParameters,
        width: canvasSize.width,
        height: canvasSize.height,
        progressInterval: qualityMode === "low" ? LOW_QUALITY_INTERVAL : 1,
        qualityMode,
        points: qualityMode === "low" ? LOW_QUALITY_POINTS : DEFAULT_POINTS,
        defaultScale: DEFAULT_SCALE,
        sharedBuffer: sharedBufferRef.current,
      });
      return;
    }
    
    setProgress(progress);
    if(!progress){
      setImageUrl(null);
    }
    
    if ((type === "preview" || type === "done") && sharedBufferRef.current && canvasRef.current && params) {
      // Use the shared buffer for drawing: worker sends Uint32Array pixel data (ARGB or RGBA)
      const w = width || canvasSize.width;
      const h = height || canvasSize.height;
      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) return;
      const imageData = ctx.createImageData(w, h);
      // Copy from sharedBufferRef.current to imageData.data.buffer as Uint32Array
      const src = new Uint32Array(sharedBufferRef.current, 0, w * h);
      const dst = new Uint32Array(imageData.data.buffer, 0, w * h);
      dst.set(src);
      ctx.putImageData(imageData, 0, 0);
    }

    if(type === "done" && canvasRef.current && qualityMode === "high") {
      setImageUrl(canvasRef.current.toDataURL("image/png"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[canvasSize, attractorParameters])

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

    const worker = new Worker(new URL("../../workers/attractor-worker-sharedarr.ts", import.meta.url), { type: "module" });
    workerRef.current = worker;

    worker.onmessage = handleWorkerMessage;
    setOnInitResize(() => {
      worker.postMessage({
        type: 'stop'
      })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [benchmarkResult, attractorParameters, canvasSize, handleWorkerMessage]);

  useEffect(() => {
    return () => {
      setOnInitResize(() => {})
      if(workerRef.current) {
        workerRef.current.terminate()
        workerRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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