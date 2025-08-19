// Web Worker for Attractor Calculations using WebAssembly
import AttractorModule from "./attractor-calc.mjs";

// Initialize the WebAssembly module
let wasmModule = null;

// Handle messages from the main thread
self.onmessage = async function (e) {
  const { type, data } = e.data;
  console.log("Worker Draw received message:", type, data);

  switch (type) {
    case "init":
      try {
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

    case "calculate":
      if (!wasmModule) {
        self.postMessage({
          type: "error",
          message: "WebAssembly module not initialized",
        });
        return;
      }

      performAttractorLoopCalculation(data);
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
async function performAttractorLoopCalculation(data) {
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
      iterations = 10000,
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
    // emscripten::val infoBuffer;
    // emscripten::val imageBuffer;
    // bool highQuality;
    // int pointsToCalculate;
    // int width;
    // int height;
    // double x;
    // double y;
    // int loopNum;

    const loopNum = highQuality ? 100 : 5;
    const drawAt = highQuality ? iterations / 10 : iterations / 5;
    console.log(
      "loopNum: ",
      loopNum,
      "drawAt: ",
      drawAt,
      "iterations",
      iterations,
    );

    wasmModule.calculateAttractorLoop({
      attractorParams,
      densityBuffer,
      infoBuffer,
      imageBuffer,
      highQuality,
      pointsToCalculate: iterations,
      width,
      height,
      x: 0,
      y: 0,
      loopNum,
      drawAt,
    });

    const info = new Uint32Array(infoBuffer);
    // if(!canceled)
    if (!info[1]) {
      console.log("calc done in", performance.now() - start, "ms");
      // update the doneFlag
      info[2] = 1;
    }

    self.postMessage({ type: "done" });
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
