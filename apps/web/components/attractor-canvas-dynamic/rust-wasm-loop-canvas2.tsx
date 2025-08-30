"use client";

import { useRef, useEffect, useState } from "react";
import { useUIStore } from "@/store/ui-store";
import { useAttractorStore } from "@repo/state/attractor-store";

export function RustWasmLoopCanvas2({ ariaLabel }: { ariaLabel?: string }) {
  const canvasSize = useUIStore((s) => s.canvasSize);
  const setOnInitResize = useUIStore((s) => s.setOnInitResize);
  const qualityMode = useUIStore((s) => s.qualityMode);
  const setProgress = useUIStore((s) => s.setProgress);
  const setImageUrl = useUIStore((s) => s.setImageUrl);

  const [readyState, setReadyState] = useState({
    canvasSize: false,
    workerReady: false,
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const attractorParameters = useAttractorStore((s) => s.attractorParameters);

  // set width and height
  useEffect(() => {
    if (!readyState.canvasSize) return;
    if (!readyState.workerReady) return;
    if (!canvasSize) return;

    setImageUrl(null);
    workerRef.current?.postMessage({
      type: "size",
      data: { canvasSize },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasSize, readyState]);

  // set params update
  useEffect(() => {
    if (!readyState.canvasSize) return;
    if (!readyState.workerReady) return;
    if (!canvasSize) return;

    setImageUrl(null);
    workerRef.current?.postMessage({
      type: "update",
      data: {
        attractorParameters,
        qualityMode,
      },
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attractorParameters, readyState, qualityMode]);

  // set ready state when canvasSize is ready
  useEffect(() => {
    if (readyState.canvasSize) return;
    if (!canvasSize) return;
    setReadyState((prev) => ({ ...prev, canvasSize: true }));
  }, [canvasSize, readyState]);

  // set the worker
  useEffect(() => {
    if (!canvasSize) return;
    if (workerRef.current) return;

    const worker = new Worker(
      new URL("../../workers/attractor-worker-wasm/index.ts", import.meta.url),
      { type: "module" },
    );

    workerRef.current = worker;
    worker.onmessage = (e) => {
      // console.log('received from worker', e.data)

      const { type, data } = e.data;

      if (type === "ready") {
        if (!canvasRef.current) throw new Error("Canvas not ready");
        const offscreen = canvasRef.current?.transferControlToOffscreen();
        if (!offscreen) throw new Error("Offscreen not supported");
        worker.postMessage(
          {
            type: "init",
            data: { canvas: offscreen },
          },
          [offscreen],
        );
        setReadyState((prev) => ({ ...prev, workerReady: true }));
      }

      if (type === "progress") {
        setProgress(data.progress);
      }

      if (type === "done") {
        if (canvasRef.current && data.highQuality)
          setImageUrl(canvasRef.current.toDataURL("image/png"));
      }

      if (type === "error") {
        // handle this somehow
      }
    };

    // handle resize
    setOnInitResize(() => {
      worker.postMessage({
        type: "stop",
      });
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasSize]);

  useEffect(() => {
    return () => {
      workerRef.current?.postMessage({
        type: "terminate",
      });
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={ariaLabel || "Rust WebAssembly Attractor Visualization"}
      width={canvasSize?.width}
      height={canvasSize?.height}
      style={{ touchAction: "none" }}
      className={`block w-full h-full transition-opacity`}
    />
  );
}
