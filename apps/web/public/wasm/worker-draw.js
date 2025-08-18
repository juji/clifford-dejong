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
      performAttractorDrawing(data);
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
async function performAttractorDrawing(data) {
  try {
    const {
      attractor,
      a,
      b,
      c,
      d,
      hue,
      saturation,
      brightness,
      background,
      scale,
      left,
      top,
      width = 800,
      height = 800,
      highQuality = false,
      densityBuffer = new SharedArrayBuffer(width * height * 4),
      imageBuffer = new SharedArrayBuffer(width * height * 4),
      infoBuffer = new SharedArrayBuffer(4 * 4), // uint32: maxDensity, cancel, done, progress (0-100)
    } = data;

    // Call the WebAssembly function
    const start = performance.now();

    // Create parameters object matching the C++ implementation
    const attractorParams = {
      attractor,
      a,
      b,
      c,
      d,
      hue: hue || 0,
      saturation: saturation || 100,
      brightness: brightness || 100,
      background: background || [0, 0, 0, 255],
      scale,
      left,
      top,
    };

    // emscripten::val attractorParams;
    // emscripten::val densityBuffer;
    // emscripten::val imageBuffer;
    // emscripten::val infoBuffer;
    // bool highQuality;
    // int width;
    // int height;

    const info = new Uint32Array(infoBuffer);
    const ctx = offscreenCanvas.getContext("2d");
    const imageData = ctx.createImageData(width, height);
    const dst = new Uint32Array(imageData.data.buffer);
    const imageView = new Uint32Array(imageBuffer);

    while (
      !info[2] && // not done
      !info[1] // not canceled
    ) {
      wasmModule.createAttractorImage({
        attractorParams,
        densityBuffer,
        imageBuffer,
        infoBuffer,
        highQuality,
        width,
        height,
      });

      dst.set(imageView);
      ctx.putImageData(imageData, 0, 0);
      self.postMessage({ type: "progress", progress: info[3] / 100 });

      // Add a short sleep to prevent CPU hogging
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    // if not cancelled
    if (!info[1]) {
      wasmModule.createAttractorImage({
        attractorParams,
        densityBuffer,
        imageBuffer,
        infoBuffer,
        highQuality,
        width,
        height,
      });

      // update the doneFlag and progress
      info[2] = 0;
      info[3] = 100;

      // set final image data
      dst.set(imageView);
      offscreenCtx.putImageData(imageData, 0, 0);
      self.postMessage({ type: "progress", progress: info[3] / 100 });
    }

    console.log("draw done in", performance.now() - start, "ms");

    //
    self.postMessage({ type: "done" });
  } catch (error) {
    self.postMessage({
      type: "error",
      message: "Error calculating attractor",
      error: error.toString(),
    });
  }
}

// Report that the worker is ready
self.postMessage({ type: "ready" });
