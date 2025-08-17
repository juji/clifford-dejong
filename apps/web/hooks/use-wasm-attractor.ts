import { useState, useEffect, useCallback, useRef } from "react";
import type { AttractorParameters } from "@repo/core/types";

// Types for the hook
interface AttractorWorkerParams extends AttractorParameters {
  // Additional rendering parameters not in the core type
  iterations?: number;
  totalItterations?: number;
  highQuality?: boolean;
  width?: number;
  height?: number;
}

interface AttractorCalculationResult {
  progress: number;
  duration?: number;
  cancelled?: boolean;
}

interface AttractorCallbacks {
  onProgress?: (progress: number, wasDrawn: boolean) => void;
  onComplete?: (result: AttractorCalculationResult) => void;
  onError?: (error: any) => void;
  onBusy?: () => void;
}

/**
 * Hook to interact with the WebAssembly attractor calculator worker
 * This hook provides a way to calculate attractor points using the WebAssembly module
 * in a separate thread via a Web Worker.
 *
 * @returns {Object} Methods and state for working with the attractor calculator
 */
export function useWasmAttractor() {
  const [isReady, setIsReady] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [performanceRating, setPerformanceRating] = useState<number | null>(
    null,
  );
  const [progress, setProgress] = useState<number>(0);

  const workerRef = useRef<Worker | null>(null);
  const densityBufferRef = useRef<SharedArrayBuffer | null>(null);
  const imageBufferRef = useRef<SharedArrayBuffer | null>(null);
  const callbacksRef = useRef<AttractorCallbacks>({});

  // Initialize the worker
  useEffect(() => {
    // Create the worker
    const worker = new Worker("/wasm/worker.js", { type: "module" });

    // Set up message handling
    worker.onmessage = (e) => {
      const { type, ...data } = e.data;
      console.log("Message from worker:", e.data);

      switch (type) {
        case "ready":
          // Worker script has loaded, initialize the WebAssembly module
          worker.postMessage({ type: "init" });
          break;

        case "initialized":
          setIsReady(true);
          // Run a performance test when initialized
          worker.postMessage({ type: "performance-test" });
          break;

        case "result":
          if (data.progress !== undefined) {
            setProgress(data.progress);
            if (callbacksRef.current.onProgress) {
              callbacksRef.current.onProgress(data.progress, data.wasDrawn);
            }

            // If progress is 1, calculation is complete
            if (data.progress === 1) {
              setIsCalculating(false);
              if (callbacksRef.current.onComplete) {
                callbacksRef.current.onComplete({
                  progress: 1,
                  duration: data.duration,
                });
              }
            }
          }
          break;

        case "performance-result":
          setPerformanceRating(data.rating);
          break;

        case "busy":
          if (callbacksRef.current.onBusy) {
            callbacksRef.current.onBusy();
          }
          break;

        case "error":
          setIsCalculating(false);
          setError(new Error(data.message || "Unknown error"));
          if (callbacksRef.current.onError) {
            callbacksRef.current.onError(data);
          }
          break;

        default:
          console.warn("Unknown message from worker:", e.data);
      }
    };

    // Handle worker errors
    worker.onerror = (errorEvent) => {
      const errorObj = new Error(errorEvent.message || "Worker error");
      setError(errorObj);
      setIsCalculating(false);
      if (callbacksRef.current.onError) {
        callbacksRef.current.onError({
          message: errorEvent.message,
          error: errorObj.toString(),
        });
      }
    };

    // Save the worker reference
    workerRef.current = worker;

    // Clean up on unmount
    return () => {
      console.log("clean up");
      if (worker) {
        worker.postMessage({ type: "terminate" });
        worker.terminate();
      }
    };
  }, []);

  /**
   * Calculate attractor points using the WebAssembly module via the worker
   * @returns A function to cancel the current calculation, or false if calculation couldn't start
   */
  const calculateAttractor = useCallback(
    (
      params: AttractorWorkerParams,
      callbacks?: AttractorCallbacks,
      options?: {
        width?: number;
        height?: number;
        iterations?: number;
        totalItterations?: number;
        drawOn?: number;
        highQuality?: boolean;
      },
    ) => {
      if (!workerRef.current || !isReady) {
        const error = new Error("WebAssembly worker not initialized");
        setError(error);
        if (callbacks?.onError) {
          callbacks.onError({ message: error.message, type: "initialization" });
        }
        return false;
      }

      if (isCalculating) {
        if (callbacks?.onBusy) callbacks.onBusy();
        return false;
      }

      // Save callbacks for later use
      callbacksRef.current = callbacks || {};

      // Reset progress
      setProgress(0);

      // Start calculation
      setIsCalculating(true);
      setError(null);

      const width = options?.width || 800;
      const height = options?.height || 800;

      // Create new shared buffers
      densityBufferRef.current = new SharedArrayBuffer(width * height * 4);
      imageBufferRef.current = new SharedArrayBuffer(width * height * 4);

      workerRef.current.postMessage({
        type: "calculate",
        data: {
          ...params,
          width,
          height,
          iterations: options?.iterations || 1000000,
          totalItterations: options?.totalItterations || 20000000,
          drawOn: options?.drawOn || 1000000,
          highQuality:
            options?.highQuality !== undefined ? options.highQuality : true,
          densityBuffer: densityBufferRef.current,
          imageBuffer: imageBufferRef.current,
        },
      });

      // Return a cancel function
      return () => {
        if (workerRef.current && isCalculating) {
          // Signal the worker to cancel the calculation
          workerRef.current.postMessage({ type: "cancel" });
          setIsCalculating(false);
          setProgress(0);
          if (callbacks?.onComplete) {
            callbacks.onComplete({ progress: 0, cancelled: true });
          }
        }
      };
    },
    [isReady, isCalculating],
  );

  /**
   * Get the current density and image buffers for rendering
   */
  const getBuffers = useCallback(() => {
    if (!densityBufferRef.current || !imageBufferRef.current) {
      return null;
    }

    return {
      densityBuffer: densityBufferRef.current,
      imageBuffer: imageBufferRef.current,
    };
  }, []);

  /**
   * Run a performance test to determine an appropriate point count
   */
  const testPerformance = useCallback(() => {
    if (!workerRef.current || !isReady) {
      return;
    }

    workerRef.current.postMessage({ type: "performance-test" });
  }, [isReady]);

  return {
    isReady,
    isCalculating,
    error,
    performanceRating,
    progress,
    calculateAttractor,
    getBuffers,
    testPerformance,
  };
}
