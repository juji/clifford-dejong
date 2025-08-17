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
      iterations = 1000000,
      totalItterations = 20000000,
      drawOn = 1000000,
      width = 800,
      height = 800,
      highQuality = true,
      densityBuffer = new SharedArrayBuffer(width * height * 4),
      imageBuffer = new SharedArrayBuffer(width * height * 4),
      maxDensityBuffer = new SharedArrayBuffer(4),
      cancelBuffer = new SharedArrayBuffer(1),
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

    const totalLoops = Math.ceil(totalItterations / iterations);
    const drawOnLoop = Math.floor(totalItterations / drawOn);
    let loopCount = 0;
    let currentX = 0;
    let currentY = 0;
    let result;

    while (loopCount < totalLoops && isCalculatingCopy === isCalculating) {
      const isDrawing =
        loopCount % drawOnLoop === 0 || loopCount === totalLoops - 1;

      result = wasmModule.calculateAttractor(
        attractorParams,
        densityBuffer,
        maxDensityBuffer,
        imageBuffer,
        cancelBuffer,
        highQuality,
        width,
        height,
        currentX,
        currentY, // Pass current x,y state
        iterations,

        // limit draw times
        isDrawing,
      );

      // Update for next iteration using returned values
      if (result && !result.error && isCalculatingCopy === isCalculating) {
        currentX = result.x;
        currentY = result.y;

        self.postMessage({
          type: "result",
          progress: loopCount / totalLoops,
          wasDrawn: isDrawing,
        });
      } else if (result && result.error) {
        throw new Error(result.error);
      }

      loopCount++;
    }

    if (isCalculatingCopy === isCalculating) {
      const end = performance.now();
      const duration = end - start;

      // Send the result with duration
      // as a mark that this is the end of the calculation
      self.postMessage({
        type: "result",
        duration,
        progress: 1,
        wasDrawn: true,
      });
    }
  } catch (error) {
    self.postMessage({
      type: "error",
      message: "Error calculating attractor",
      error: error.toString(),
    });
  } finally {
    isCalculating = false;
  }
}

// Report that the worker is ready
self.postMessage({ type: "ready" });
