"use client";

import { useRef, useEffect, useState } from "react";
import { useUIStore } from "@/store/ui-store";
import { useAttractorStore } from "@repo/state/attractor-store";

import {
  DEFAULT_POINTS,
  DEFAULT_SCALE,
  LOW_QUALITY_POINTS,
} from "@/lib/constants";

export function WasmLoopCanvas({ ariaLabel }: { ariaLabel?: string }) {
  const canvasSize = useUIStore((s) => s.canvasSize);
  const qualityMode = useUIStore((s) => s.qualityMode);
  const setProgress = useUIStore((s) => s.setProgress);
  const setImageUrl = useUIStore((s) => s.setImageUrl);
  const [init, setInit] = useState(false);
  const [ready, setReady] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const workerCalcRef = useRef<Worker | null>(null);
  const workerDrawRef = useRef<Worker | null>(null);
  const attractorParameters = useAttractorStore((s) => s.attractorParameters);
  const infoBufferRef = useRef<SharedArrayBuffer | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!init) return;
    if (!canvasSize) return;
    if (!canvasRef.current) return;
    if (!workerDrawRef.current) return;
    if (!workerCalcRef.current) return;

    const densityBuffer = new SharedArrayBuffer(
      canvasSize?.width * canvasSize?.height * 4,
    );
    const imageBuffer = new SharedArrayBuffer(
      canvasSize?.width * canvasSize?.height * 4,
    );
    infoBufferRef.current = new SharedArrayBuffer(4 * 4); // uint32: maxDensity, cancel, done, progress (0-100)

    const data = {
      ...attractorParameters,
      scale: attractorParameters.scale * DEFAULT_SCALE,
      highQuality: qualityMode === "high",
      width: canvasSize.width,
      height: canvasSize.height,
      iterations: qualityMode === "low" ? LOW_QUALITY_POINTS : DEFAULT_POINTS,
      densityBuffer,
      imageBuffer,
      infoBuffer: infoBufferRef.current,
    };

    workerCalcRef.current?.postMessage({
      type: "calculate",
      data,
    });

    workerDrawRef.current?.postMessage({
      type: "draw",
      data,
    });

    return () => {
      // cancel all operation
      if (infoBufferRef.current) {
        const uint32 = new Uint32Array(infoBufferRef.current);
        uint32[1] = 1;
      }
    };
  }, [init, ready, attractorParameters, qualityMode, canvasSize]);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (!init) return;

    workerDrawRef.current = new Worker("/wasm/worker-loop-draw.js", {
      type: "module",
    });
    workerCalcRef.current = new Worker("/wasm/worker-loop-calc.js", {
      type: "module",
    });

    let readyState = 0;
    let initializedState = 0;

    workerDrawRef.current.onmessage = (e) => {
      if (e.data.type === "ready") {
        readyState++;
        if (readyState === 2) {
          onBothReady();
        }
      }
      if (e.data.type === "initialized") {
        initializedState++;
        if (initializedState === 2) {
          onBothInitialized();
        }
      }
      if (e.data.type === "error") {
        console.error("Worker Draw Error:", e.data.message);
      }
      if (e.data.type === "done") {
        console.log("Worker Draw Done");
        if (canvasRef.current)
          setImageUrl(canvasRef.current.toDataURL("image/png"));
      }
      if (e.data.type === "progress") {
        // console.log("Worker Draw Progress:", e.data.progress);
        setProgress(e.data.progress);
      }
    };

    workerCalcRef.current.onmessage = (e) => {
      if (e.data.type === "ready") {
        readyState++;
        if (readyState === 2) {
          onBothReady();
        }
      }
      if (e.data.type === "initialized") {
        initializedState++;
        if (initializedState === 2) {
          onBothInitialized();
        }
      }
      if (e.data.type === "error") {
        console.error("Worker Calc Error:", e.data.message);
      }
      if (e.data.type === "done") {
        console.log("Worker Calc Done");
      }
    };

    function onBothInitialized() {
      setReady(true);
    }

    function onBothReady() {
      const offscreen = canvasRef.current?.transferControlToOffscreen();
      if (offscreen)
        workerDrawRef.current?.postMessage(
          {
            type: "init",
            data: {
              canvas: offscreen,
            },
          },
          [offscreen],
        );

      workerCalcRef.current?.postMessage({
        type: "init",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [init]);

  useEffect(() => {
    if (!init && canvasSize?.height && canvasSize?.width) {
      console.log("set init");
      setInit(true);
    }
  }, [init, canvasSize]);

  useEffect(() => {
    return () => {
      // cancel all operation
      if (infoBufferRef.current) {
        const uint32 = new Uint32Array(infoBufferRef.current);
        uint32[1] = 1;
      }
      workerDrawRef.current?.terminate();
      workerCalcRef.current?.terminate();
    };
  }, []);

  return canvasSize ? (
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
