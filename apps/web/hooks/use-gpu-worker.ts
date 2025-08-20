import { useRef, useCallback, useEffect } from "react";

interface UseGPUWorkerOptions {
  onReady?: () => void;
  onInitialized?: () => void;
  onError?: (error: string) => void;
  onComputationComplete?: (data: any) => void;
  onCanvasTransferred?: () => void;
}

export const useGPUWorker = (options: UseGPUWorkerOptions = {}) => {
  const workerRef = useRef<Worker | null>(null);
  const canvasTransferredRef = useRef<boolean>(false);
  const {
    onReady,
    onInitialized,
    onError,
    onComputationComplete,
    onCanvasTransferred,
  } = options;

  const createWorker = useCallback(() => {
    if (typeof window === "undefined" || workerRef.current) return null;

    try {
      // Create worker from the public directory
      const worker = new Worker("/workers/gpu-offscreen-worker.js");

      // Set up message handling
      worker.onmessage = (event) => {
        const { type, payload } = event.data;

        switch (type) {
          case "WORKER_READY":
            onReady?.();
            break;
          case "INIT_COMPLETE":
            onInitialized?.();
            break;
          case "COMPUTATION_COMPLETE":
            onComputationComplete?.(payload);
            break;
          case "INIT_ERROR":
          case "COMPUTATION_ERROR":
          case "ERROR":
            onError?.(payload.error);
            break;
        }
      };

      worker.onerror = (error) => {
        onError?.(error.message);
      };

      workerRef.current = worker;
      return worker;
    } catch (error) {
      onError?.(
        error instanceof Error ? error.message : "Failed to create worker",
      );
      return null;
    }
  }, []); // Remove callback dependencies to prevent recreation

  const initializeCanvas = useCallback(
    (canvas: HTMLCanvasElement, width: number, height: number) => {
      if (!workerRef.current || canvasTransferredRef.current) {
        console.warn("Worker not available or canvas already transferred");
        return false;
      }

      try {
        const offscreen = canvas.transferControlToOffscreen();
        canvasTransferredRef.current = true;
        onCanvasTransferred?.();

        workerRef.current.postMessage(
          {
            type: "INIT_CANVAS",
            payload: { canvas: offscreen, width, height },
          },
          [offscreen],
        );

        return true;
      } catch (error) {
        canvasTransferredRef.current = false;
        onError?.(
          error instanceof Error
            ? error.message
            : "Failed to initialize canvas",
        );
        return false;
      }
    },
    [],
  ); // Remove dependencies to prevent recreation

  const computeAttractor = useCallback(
    (params: any, width: number, height: number, pointCount: number) => {
      if (!workerRef.current) return false;

      workerRef.current.postMessage({
        type: "COMPUTE_ATTRACTOR",
        payload: { params, width, height, pointCount },
      });

      return true;
    },
    [],
  );

  const cleanup = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    canvasTransferredRef.current = false;
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    createWorker,
    initializeCanvas,
    computeAttractor,
    cleanup,
    worker: workerRef.current,
  };
};
