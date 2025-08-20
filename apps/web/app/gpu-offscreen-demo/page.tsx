"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAttractorStore } from "@repo/state/attractor-store";
import Link from "next/link";
import { useGPUWorker } from "../../hooks/use-gpu-worker";

interface PerformanceResult {
  computation: number;
  rendering: number;
  total: number;
}

interface WorkerState {
  isReady: boolean;
  isInitialized: boolean;
  canvasTransferred: boolean;
  error: string | null;
}

export default function GPUOffscreenDemoPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [workerState, setWorkerState] = useState<WorkerState>({
    isReady: false,
    isInitialized: false,
    canvasTransferred: false,
    error: null,
  });
  const [performanceResults, setPerformanceResults] =
    useState<PerformanceResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [browserSupport, setBrowserSupport] = useState<{
    webgl: boolean;
    webgl2: boolean;
    offscreenCanvas: boolean;
    webWorkers: boolean;
    isSupported: boolean;
  } | null>(null);

  // Get attractor parameters from the store
  const { attractorParameters } = useAttractorStore();

  // Configuration
  const pointCount = 2_000_000;
  const canvasWidth = 400;
  const canvasHeight = 400;

  // GPU Worker hook
  const { createWorker, initializeCanvas, computeAttractor } = useGPUWorker({
    onReady: () => {
      console.log("Worker is ready");
      setWorkerState((prev) => ({ ...prev, isReady: true }));
    },
    onInitialized: () => {
      console.log("OffscreenCanvas initialized");
      setWorkerState((prev) => ({ ...prev, isInitialized: true }));
    },
    onCanvasTransferred: () => {
      console.log("Canvas control transferred to worker");
      setWorkerState((prev) => ({ ...prev, canvasTransferred: true }));
    },
    onError: (error: string) => {
      console.error("Worker error:", error);
      setWorkerState((prev) => ({ ...prev, error }));
      setIsRunning(false);
    },
    onComputationComplete: (payload: { performance: PerformanceResult }) => {
      const { performance: perf } = payload;
      setPerformanceResults(perf);
      setIsRunning(false);
      console.log("Computation complete - rendered directly to canvas");
    },
  });

  // Check browser capabilities
  const checkBrowserSupport = useCallback(() => {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl");
    const gl2 = canvas.getContext("webgl2");

    const support = {
      webgl: !!gl,
      webgl2: !!gl2,
      offscreenCanvas: typeof OffscreenCanvas !== "undefined",
      webWorkers: typeof Worker !== "undefined",
      isSupported: false,
    };

    // Need WebGL, OffscreenCanvas, and Web Workers for this demo
    support.isSupported =
      support.webgl && support.offscreenCanvas && support.webWorkers;

    setBrowserSupport(support);
    return support;
  }, []);

  // Check browser support on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      checkBrowserSupport();
    }
  }, [checkBrowserSupport]);

  // Initialize worker when support is confirmed
  useEffect(() => {
    if (browserSupport?.isSupported && !workerState.isReady) {
      createWorker();
    }
  }, [browserSupport?.isSupported, workerState.isReady, createWorker]);

  // Initialize canvas when worker is ready but canvas hasn't been transferred yet
  useEffect(() => {
    if (
      workerState.isReady &&
      !workerState.canvasTransferred &&
      !workerState.isInitialized &&
      canvasRef.current
    ) {
      console.log("Attempting to transfer canvas control to worker");
      // Set canvas dimensions before transferring
      canvasRef.current.width = canvasWidth;
      canvasRef.current.height = canvasHeight;
      initializeCanvas(canvasRef.current, canvasWidth, canvasHeight);
    }
  }, [
    workerState.isReady,
    workerState.canvasTransferred,
    workerState.isInitialized,
    initializeCanvas,
  ]);

  // Run the attractor computation
  const runDemo = useCallback(async () => {
    if (!workerState.isInitialized) return;

    setIsRunning(true);
    setPerformanceResults(null);

    computeAttractor(
      attractorParameters,
      canvasWidth,
      canvasHeight,
      pointCount,
    );
  }, [workerState.isInitialized, attractorParameters, computeAttractor]);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">
          GPU.js OffscreenCanvas Worker Demo
        </h1>
        <Link
          href="/gpu-demo"
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-sm"
        >
          ← Basic GPU.js Demo
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-4">
          {/* Browser Support Check */}
          {browserSupport && !browserSupport.isSupported && (
            <div className="p-4 rounded border border-red-500 bg-red-50">
              <h3 className="font-medium text-red-800 mb-2">
                ⚠️ Browser Compatibility Issues
              </h3>
              <div className="text-sm text-red-700 space-y-1">
                <p className="font-medium">
                  Your browser doesn&apos;t support required features:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  {!browserSupport.webgl && <li>WebGL is not available</li>}
                  {!browserSupport.offscreenCanvas && (
                    <li>OffscreenCanvas is not available</li>
                  )}
                  {!browserSupport.webWorkers && (
                    <li>Web Workers are not available</li>
                  )}
                </ul>
                <p className="mt-2 font-medium">
                  Please try a modern browser like Chrome 69+, Firefox 105+, or
                  Safari 16.4+.
                </p>
              </div>
            </div>
          )}

          {browserSupport && browserSupport.isSupported && (
            <div className="p-3 rounded border border-green-500 bg-green-50">
              <h3 className="font-medium text-green-800 mb-1">
                ✅ All Features Supported
              </h3>
              <div className="text-xs text-green-700">
                WebGL: {browserSupport.webgl ? "✓" : "✗"} | WebGL2:{" "}
                {browserSupport.webgl2 ? "✓" : "✗"} | OffscreenCanvas:{" "}
                {browserSupport.offscreenCanvas ? "✓" : "✗"} | WebWorkers:{" "}
                {browserSupport.webWorkers ? "✓" : "✗"}
              </div>
            </div>
          )}

          {/* Worker Status */}
          {browserSupport?.isSupported && (
            <div className="p-3 rounded border">
              <h3 className="font-medium mb-2">Worker Status:</h3>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Worker Ready:</span>
                  <span
                    className={
                      workerState.isReady ? "text-green-600" : "text-yellow-600"
                    }
                  >
                    {workerState.isReady ? "✓" : "⏳"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Canvas Transferred:</span>
                  <span
                    className={
                      workerState.canvasTransferred
                        ? "text-green-600"
                        : "text-yellow-600"
                    }
                  >
                    {workerState.canvasTransferred ? "✓" : "⏳"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Canvas Initialized:</span>
                  <span
                    className={
                      workerState.isInitialized
                        ? "text-green-600"
                        : "text-yellow-600"
                    }
                  >
                    {workerState.isInitialized ? "✓" : "⏳"}
                  </span>
                </div>
                {workerState.error && (
                  <div className="text-red-600 text-xs mt-2">
                    Error: {workerState.error}
                  </div>
                )}
              </div>
            </div>
          )}

          <button
            onClick={runDemo}
            disabled={
              isRunning ||
              !workerState.isInitialized ||
              !browserSupport?.isSupported
            }
            className="w-full p-3 rounded bg-blue-500 text-white disabled:opacity-50 disabled:bg-gray-400"
          >
            {!browserSupport?.isSupported
              ? "Browser Not Supported"
              : !workerState.isInitialized
                ? "Initializing..."
                : isRunning
                  ? "Computing in Worker..."
                  : "Generate Attractor"}
          </button>

          {performanceResults && (
            <div className="p-4 rounded border">
              <h3 className="font-medium mb-3">
                ⏱️ Performance Results (Worker):
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>GPU Computation:</span>
                  <span className="font-mono">
                    {performanceResults.computation.toFixed(2)}ms
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>OffscreenCanvas Rendering:</span>
                  <span className="font-mono">
                    {performanceResults.rendering.toFixed(2)}ms
                  </span>
                </div>
                <div className="flex justify-between font-medium border-t pt-2">
                  <span>Total Worker Time:</span>
                  <span className="font-mono">
                    {performanceResults.total.toFixed(2)}ms
                  </span>
                </div>
                <div className="text-xs opacity-75 mt-2">
                  Generated {pointCount.toLocaleString()} points off the main
                  thread
                </div>
              </div>
            </div>
          )}

          <div className="text-sm">
            <h3 className="font-medium mb-2">About This Demo:</h3>
            <p>
              This demonstration combines three modern web technologies for
              high-performance computation:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>
                <strong>GPU.js</strong>: Parallel computation on the GPU
              </li>
              <li>
                <strong>Web Workers</strong>: Off-main-thread processing
              </li>
              <li>
                <strong>OffscreenCanvas</strong>: Canvas rendering in workers
              </li>
            </ul>

            <div className="mt-3 p-2 border rounded">
              <h4 className="font-medium text-xs mb-2">Current Parameters:</h4>
              <div className="grid grid-cols-2 gap-1 text-xs font-mono">
                <span>a: {attractorParameters.a}</span>
                <span>b: {attractorParameters.b}</span>
                <span>c: {attractorParameters.c}</span>
                <span>d: {attractorParameters.d}</span>
              </div>
              <div className="mt-2 text-xs">
                <span>Scale: {attractorParameters.scale}</span>
              </div>
            </div>

            <p className="mt-2">
              All computation happens in a separate thread, keeping the UI
              responsive while processing {pointCount.toLocaleString()} points
              in parallel.
            </p>
          </div>

          <div className="text-sm">
            <h3 className="font-medium mb-2">Advantages of This Approach:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Non-blocking UI - main thread stays responsive</li>
              <li>GPU acceleration for parallel computation</li>
              <li>Efficient memory transfer with ImageBitmap</li>
              <li>Better performance isolation</li>
              <li>Scalable to more complex computations</li>
            </ul>
          </div>
        </div>

        {/* Canvas */}
        <div>
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            className="border w-full max-w-md"
            style={{ imageRendering: "pixelated" }}
          />
          <div className="text-xs text-gray-600 mt-2">
            Rendered via OffscreenCanvas in Web Worker
          </div>
        </div>
      </div>
    </div>
  );
}
