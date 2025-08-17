// Web Worker for Attractor Calculations using WebAssembly
import AttractorModule from "./attractor-calc.mjs";

// Initialize the WebAssembly module
let wasmModule = null;

// Handle messages from the main thread
self.onmessage = async function (e) {
  const { type, data } = e.data;
  console.log("Worker received message:", type, data);

  switch (type) {
    case "init":
      try {
        // Load the WebAssembly module
        // console.log('init from worker', AttractorModule);
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

    case "calculate":
      if (!wasmModule) {
        self.postMessage({
          type: "error",
          message: "WebAssembly module not initialized",
        });
        return;
      }
      performAttractorDensityCalculation(data);
      break;

    case "cancel":
      // Cancel the current calculation
      self.postMessage({
        type: "result",
        progress: 0,
        cancelled: true,
      });
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
function performAttractorDensityCalculation(data) {
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
      iterations = 20000000,
      width = 800,
      height = 800,
      densityBuffer = new SharedArrayBuffer(width * height * 4),
      infoBuffer = new SharedArrayBuffer(3 * 4), // uint32: maxDensity, cancel, done
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

    wasmModule.calculateAttractorDensity({
      attractorParams,
      densityBuffer,
      infoBuffer,
      width,
      height,
      x: 0,
      y: 0,
      pointsToCalculate: iterations,
    });

    console.log("calc done in", performance.now() - start, "ms");

    //
    self.postMessage({
      type: "done",
    });
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
