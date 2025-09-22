import type { ObservableAttractorData } from "./type";

import { DEFAULT_POINTS, DEFAULT_SCALE } from "@/lib/constants";

// Shared worker instance for all calculations
let sharedWorker: Worker | null = null;
let isWorkerInitialized = false;
let workerInitPromise: Promise<void> | null = null;

/**
 * High quality mode implementation using WebAssembly for better performance.
 * Uses Rust-compiled WASM module for attractor calculations.
 */
export function highQualityMode(
  data: ObservableAttractorData,
  onProgress: (percentComplete: number) => void = () => {},
) {
  if (
    !data.canvas ||
    !data.canvasSize ||
    !data.attractorParameters ||
    !data.qualityMode
  ) {
    return () => {};
  }

  const { canvas, canvasSize, attractorParameters } = data;
  canvas.width = canvasSize.width;
  canvas.height = canvasSize.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};

  // Initialize shared buffers for communication with the worker
  const width = canvasSize.width;
  const height = canvasSize.height;
  const highQuality = data.qualityMode === "high";
  const densityBuffer = new SharedArrayBuffer(width * height * 4);
  const imageBuffer = new SharedArrayBuffer(width * height * 4);
  const infoBuffer = new SharedArrayBuffer(4 * 4); // uint32: maxDensity, cancel, done, progress

  // Create arrays for accessing the buffers
  const imageArray = new Uint8ClampedArray(imageBuffer);
  const infoArray = new Uint32Array(infoBuffer);

  // Clear info array
  infoArray[0] = 0; // maxDensity
  infoArray[1] = 0; // cancel flag
  infoArray[2] = 0; // done flag
  infoArray[3] = 0; // progress (0-100)

  // Initialize worker once if needed
  if (!sharedWorker) {
    // In a web worker, we need to use a relative or absolute path
    // For relative paths, it's relative to the worker's location
    sharedWorker = new Worker(
      // rust
      `${self.location.origin}/wasm/worker-loop-calc-rust.js`,
      // cpp
      // `${self.location.origin}/wasm/worker-loop-calc.js`,
      {
        type: "module",
      },
    );
  }

  // Keep reference to the worker
  const worker = sharedWorker;

  // Function to initialize the worker once if not already done
  function initializeWorkerOnce(): Promise<void> {
    // If already initialized, return resolved promise
    if (isWorkerInitialized) {
      return Promise.resolve();
    }

    // If initialization is in progress, return that promise
    if (workerInitPromise) {
      return workerInitPromise;
    }

    // Otherwise, create a new initialization promise
    workerInitPromise = new Promise((resolve, reject) => {
      if (!worker) {
        reject(new Error("Worker not created"));
        return;
      }

      // Setup one-time initialization handlers
      const initHandler = (event: MessageEvent) => {
        const { type, data } = event.data;

        if (type === "initialized") {
          isWorkerInitialized = true;
          worker.removeEventListener("message", initHandler);
          resolve();
        } else if (type === "error" && !isWorkerInitialized) {
          worker.removeEventListener("message", initHandler);
          reject(new Error(data?.message || "Worker initialization failed"));
        }
      };

      // Add handler for initialization events
      worker.addEventListener("message", initHandler);

      // Send init command if worker is ready
      const readyHandler = (event: MessageEvent) => {
        if (event.data.type === "ready") {
          worker.removeEventListener("message", readyHandler);
          worker.postMessage({ type: "init" });
        }
      };

      // Listen for ready message
      worker.addEventListener("message", readyHandler);
    });

    return workerInitPromise;
  }

  // Handle messages from the worker for this specific calculation
  const calculationHandler = (event: MessageEvent) => {
    const { type, data } = event.data;

    switch (type) {
      case "done":
        // Calculation complete, update the canvas one final time
        updateCanvas();

        // Clean up this specific handler when done
        if (worker) {
          worker.removeEventListener("message", calculationHandler);
        }
        break;

      case "error":
        console.error("Worker error:", data?.message || "Unknown error");

        // Clean up this specific handler on error
        if (worker) {
          worker.removeEventListener("message", calculationHandler);
        }
        break;
    }
  };

  // Add handler for this specific calculation
  if (worker) {
    worker.addEventListener("message", calculationHandler);
  }

  // Set up rendering loop using requestAnimationFrame
  let animationFrameId: number;
  let isRunning = true;
  let lastProgress = 0;

  function renderLoop() {
    if (!isRunning) return;

    // Update progress
    const progress = infoArray[3] || 0;
    if (progress !== lastProgress) {
      lastProgress = progress;
      onProgress(progress);

      // Update canvas with current state
      updateCanvas();
    }

    // Check if calculation is still running
    if (infoArray[2] === 0) {
      // Continue the rendering loop
      animationFrameId = requestAnimationFrame(renderLoop);
    } else {
      // Final render when done
      updateCanvas();
      onProgress(100);
    }
  }

  // Function to update the canvas with the current state of the calculation
  function updateCanvas() {
    if (!ctx) return;
    // // Create image data from the shared buffer
    const imageData = new ImageData(imageArray.slice(), width, height);
    console.log("highQ putting image data");
    ctx.putImageData(imageData, 0, 0);
  }

  // Start the calculation in the worker
  async function startCalculation() {
    if (!ctx || !worker) return;

    // Clean background first
    ctx.clearRect(0, 0, width, height);
    const bgColor = attractorParameters.background;
    ctx.fillStyle = `rgba(${bgColor[0]}, ${bgColor[1]}, ${bgColor[2]}, ${bgColor[3]})`;
    ctx.fillRect(0, 0, width, height);

    try {
      // Ensure worker is initialized before starting calculation
      await initializeWorkerOnce();

      // Start the worker with high quality parameters
      worker.postMessage({
        type: "calculate",
        data: {
          attractor: attractorParameters.attractor,
          a: attractorParameters.a,
          b: attractorParameters.b,
          c: attractorParameters.c,
          d: attractorParameters.d,
          hue: attractorParameters.hue,
          saturation: attractorParameters.saturation,
          brightness: attractorParameters.brightness,
          background: attractorParameters.background,
          scale: attractorParameters.scale * DEFAULT_SCALE,
          left: attractorParameters.left,
          top: attractorParameters.top,
          width,
          height,
          // highQuality: true,
          highQuality,
          iterations: DEFAULT_POINTS,
          densityBuffer,
          imageBuffer,
          infoBuffer,
        },
      });

      // Start rendering loop
      animationFrameId = requestAnimationFrame(renderLoop);
    } catch (error) {
      console.error("Failed to start calculation:", error);
    }
  }

  // Start the calculation process
  startCalculation();

  // Return cleanup function
  return () => {
    isRunning = false;

    // Set cancel flag to notify worker
    infoArray[1] = 1;

    // Cancel animation frame
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }

    // Clean up this specific calculation handler
    if (worker) {
      worker.removeEventListener("message", calculationHandler);
    }

    // Note: We don't terminate the worker since it's shared
  };
}
