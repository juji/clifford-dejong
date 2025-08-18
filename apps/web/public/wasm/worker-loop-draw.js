// Web Worker for Attractor Calculations using WebAssembly
import AttractorModule from "./attractor-calc.mjs";

// Initialize the WebAssembly module
let wasmModule = null;
let offscreenCanvas = null;

// Handle messages from the main thread
self.onmessage = async function (e) {
  const { type, data } = e.data;
  console.log("Worker Draw received message:", type, data);

  switch (type) {
    case "init":
      try {
        if (!data.canvas) {
          throw new Error("Offscreen canvas not provided");
        }

        // load the offscreen canvas
        offscreenCanvas = data.canvas;

        // Load the WebAssembly module
        if (!wasmModule) {
          wasmModule = await AttractorModule();
          self.postMessage({ type: "initialized" });
        }
      } catch (error) {
        console.error(error);
        self.postMessage({
          type: "error",
          message: "Failed to initialize WebAssembly module",
          error: error.toString(),
        });
      }
      break;

    case "draw":
      if (!wasmModule) {
        self.postMessage({
          type: "error",
          message: "WebAssembly module not initialized",
        });
        return;
      }

      if (!offscreenCanvas) {
        self.postMessage({
          type: "error",
          message: "Offscreen canvas not initialized",
        });
        return;
      }

      offscreenCanvas.width = data.width;
      offscreenCanvas.height = data.height;
      const ctx = offscreenCanvas.getContext("2d");
      ctx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
      performAttractorDraw(data);
      break;

    case "terminate":
      if (wasmModule) {
        // Clean up WebAssembly resources if needed
        wasmModule = null;
      }
      self.close();
      break;

    default:
      self.postMessage({ type: "error", message: `Unknown command: ${type}` });
  }
};

/**
 * Performs the attractor calculation using WebAssembly
 * This function handles the main calculation loop and reports progress
 * @param {Object} data - The calculation parameters
 */
async function performAttractorDraw(data) {
  try {
    const {
      width = 800,
      height = 800,
      imageBuffer = new SharedArrayBuffer(width * height * 4),
      infoBuffer = new SharedArrayBuffer(4 * 4), // uint32: maxDensity, cancel, done, progress (0-100)
    } = data;

    // Call the WebAssembly function
    const start = performance.now();

    const info = new Uint32Array(infoBuffer);
    const ctx = offscreenCanvas.getContext("2d");
    const imageData = ctx.createImageData(width, height);
    const dst = new Uint32Array(imageData.data.buffer);
    const imageView = new Uint32Array(imageBuffer);

    let progress = 0;

    requestAnimationFrame(async function draw() {
      let wait = true;
      while (wait) {
        if (info[3] === progress) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        } else {
          progress = info[3];
          wait = false;
        }
      }

      dst.set(imageView);
      ctx.putImageData(imageData, 0, 0);
      self.postMessage({ type: "progress", progress: info[3] });

      if (
        !info[2] && // not done
        !info[1] // not canceled
      ) {
        requestAnimationFrame(draw);
      } else {
        console.log("draw done in", performance.now() - start, "ms");
        if (!info[1]) self.postMessage({ type: "done" });
      }
    });
  } catch (error) {
    console.error(error);
    self.postMessage({
      type: "error",
      message: "Error calculating attractor",
      error: error.toString(),
    });
  }
}

// Report that the worker is ready
self.postMessage({ type: "ready" });
