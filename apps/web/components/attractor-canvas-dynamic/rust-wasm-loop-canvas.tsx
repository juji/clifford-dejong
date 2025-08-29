"use client";

import { useRef, useEffect, useState } from "react";
import { useUIStore } from "@/store/ui-store";
import { useAttractorStore } from "@repo/state/attractor-store";

import {
  DEFAULT_POINTS,
  DEFAULT_SCALE,
  LOW_QUALITY_POINTS,
} from "@/lib/constants";

export function RustWasmLoopCanvas({ ariaLabel }: { ariaLabel?: string }) {
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

  function runAttractorCalculation() {
    if (!canvasSize) return;

    const imageBuffer = new SharedArrayBuffer(
      canvasSize?.width * canvasSize?.height * 4,
    );
    const densityBuffer = new SharedArrayBuffer(
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
  }

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const changedTimes = useRef(0);
  useEffect(() => {
    if (!ready) return;
    if (!init) return;
    if (!canvasSize) return;
    if (!canvasRef.current) return;
    if (!workerDrawRef.current) return;
    if (!workerCalcRef.current) return;

    changedTimes.current = changedTimes.current + 1;

    setImageUrl(null);

    // debounce to limit memory usage
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      try {
        runAttractorCalculation();
      } catch (e) {
        // if failed
        console.error(e);
        window.location.reload();
      }
    }, 33);

    return () => {
      // cancel all operation
      if (infoBufferRef.current) {
        const uint32 = new Uint32Array(infoBufferRef.current);
        uint32[1] = 1;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [init, ready, attractorParameters, qualityMode, canvasSize]);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (!init) return;

    workerDrawRef.current = new Worker("/wasm/worker-loop-draw.js", {
      type: "module",
    });
    workerCalcRef.current = new Worker("/wasm/worker-loop-calc-rust.js", {
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
        if (canvasRef.current && e.data.highQuality)
          setImageUrl(canvasRef.current.toDataURL("image/png"));
      }
      if (e.data.type === "progress") {
        // console.log("Worker Draw Progress:", e.data.progress);
        setProgress(e.data.progress);
      }
    };

    workerCalcRef.current.onmessage = (e) => {
      if (e.data.type === "ready") {
        console.log("Rust Worker Ready:", e.data);
        readyState++;
        if (readyState === 2) {
          onBothReady();
        }
      }
      if (e.data.type === "initialized") {
        console.log("Rust Worker Initialized");
        initializedState++;
        if (initializedState === 2) {
          onBothInitialized();
        }
      }
      if (e.data.type === "error") {
        console.error("Rust Worker Calc Error:", e.data.message, e.data.error);
      }
      if (e.data.type === "done") {
        console.log("Rust Worker Calc Done:", e.data);
        if (e.data.performance) {
          console.log(
            `Rust Performance: ${e.data.performance.calculationTime.toFixed(2)}ms for ${e.data.performance.pointsCalculated} points (${e.data.performance.quality} quality)`,
          );
        }
      }
      if (e.data.type === "cancelled") {
        console.log("Rust Worker Calc Cancelled");
      }
    };

    function onBothInitialized() {
      console.log("Both workers initialized - Rust calculation ready");
      setReady(true);
    }

    function onBothReady() {
      console.log("Both workers ready - initializing with Rust calc worker");
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
      console.log("Initializing Rust WASM Loop Canvas");
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
      aria-label={ariaLabel || "Rust WebAssembly Attractor Visualization"}
      width={canvasSize.width}
      height={canvasSize.height}
      style={{ touchAction: "none" }}
      className={`block w-full h-full transition-opacity`}
    />
  ) : null;
}
