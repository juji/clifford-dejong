// Web Worker for Attractor Calculations using WebAssembly
import AttractorModule from "./attractor-calc.mjs";

// Initialize the WebAssembly module
let wasmModule = null;
let isCalculating = null;

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
          const moduleInstance = await AttractorModule();
          wasmModule = new moduleInstance.AttractorCalculator();
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
      isCalculating = new Date().toISOString();

      if (!wasmModule) {
        self.postMessage({
          type: "error",
          message: "WebAssembly module not initialized",
        });
        return;
      }
      performAttractorCalculation(data);
      break;

    case "performance-test":
      if (!wasmModule) {
        self.postMessage({
          type: "error",
          message: "WebAssembly module not initialized",
        });
        return;
      }

      try {
        // Call the standalone ratePerformance function from the module
        const moduleInstance = await AttractorModule();
        const rating = moduleInstance.ratePerformance();
        self.postMessage({
          type: "performance-result",
          rating,
        });
      } catch (error) {
        self.postMessage({
          type: "error",
          message: "Error running performance test",
          error: error.toString(),
        });
      }
      break;

    case "cancel":
      // Cancel the current calculation
      isCalculating = false;
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
function performAttractorCalculation(data) {
  try {
    const isCalculatingCopy = isCalculating;

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
      maxDensityBuffer = new SharedArrayBuffer(4),
    } = data;

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

    let currentX = 0;
    let currentY = 0;
    let currentMaxDensity = 0;
    let result;

    result = wasmModule.calculateAttractorDensity(
      attractorParams,
      densityBuffer,
      maxDensityBuffer,
      width,
      height,
      currentX,
      currentY,

      iterations,
    );

    if (result && !result.error && isCalculatingCopy === isCalculating) {
      currentX = result.x;
      currentY = result.y;

      self.postMessage({
        type: "result",
      });
    } else if (result && result.error) {
      throw new Error(result.error);
    }
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
