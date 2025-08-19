// Web Worker for Attractor Calculations using Rust WebAssembly
import init, {
  calculate_attractor_loop,
  get_build_number,
} from "./attractor-calc-rust.mjs";
import { calculateAttractorLoop } from "./calculate-attractor-loop.js";

// Initialize the Rust WebAssembly module
let wasmInitialized = false;

// Handle messages from the main thread
self.onmessage = async function (e) {
  const { type, data } = e.data;
  console.log("Rust Worker received message:", type, data);

  switch (type) {
    case "init":
      try {
        // Initialize the Rust WebAssembly module
        if (!wasmInitialized) {
          await init();
          wasmInitialized = true;
          console.log(
            "Rust WebAssembly module initialized. Build:",
            get_build_number(),
          );
          self.postMessage({ type: "initialized" });
        }
      } catch (error) {
        console.error("Failed to initialize Rust WebAssembly module:", error);
        self.postMessage({
          type: "error",
          message: "Failed to initialize Rust WebAssembly module",
          error: error.toString(),
        });
      }
      break;

    case "calculate":
      if (!wasmInitialized) {
        self.postMessage({
          type: "error",
          message: "Rust WebAssembly module not initialized",
        });
        return;
      }

      if (data.highQuality) performRustAttractorLoopCalculation(data);
      else performLowQualityCalculation(data);
      break;

    case "terminate":
      if (wasmInitialized) {
        // Clean up WebAssembly resources if needed
        wasmInitialized = false;
      }
      self.close();
      break;

    default:
      self.postMessage({ type: "error", message: `Unknown command: ${type}` });
  }
};

async function performLowQualityCalculation(data) {
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

    // Call the JavaScript function
    const start = performance.now();

    // Create parameters object matching the implementation
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

    const loopNum = 1; // Low quality uses single loop
    const pointsToCalculate = 40000; // Lower point count for speed
    const drawAt = pointsToCalculate; // Draw at the end

    console.log(
      "JS Low Quality - loopNum:",
      loopNum,
      "drawAt:",
      drawAt,
      "pointsToCalculate:",
      pointsToCalculate,
    );

    const result = calculateAttractorLoop({
      attractorParams,
      densityBuffer,
      infoBuffer,
      imageBuffer,
      highQuality,
      pointsToCalculate,
      width,
      height,
      x: 0,
      y: 0,
      loopNum,
      drawAt,
    });

    // Check for errors
    if (result.error) {
      throw new Error(result.error);
    }

    const info = new Uint32Array(infoBuffer);
    // if(!canceled)
    if (!info[1]) {
      console.log("JS calc done in", performance.now() - start, "ms");
      // update the doneFlag
      info[2] = 1;
    }

    self.postMessage({ type: "done" });
  } catch (error) {
    console.error(error);
    self.postMessage({
      type: "error",
      message: "Error calculating attractor with JavaScript",
      error: error.toString(),
    });
  }
}

/**
 * Performs the attractor calculation using Rust WebAssembly
 * This function handles the main calculation loop and reports progress
 * @param {Object} data - The calculation parameters
 */
async function performRustAttractorLoopCalculation(data) {
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

    // Call the Rust WebAssembly function
    const start = performance.now();

    // Create parameters object matching the Rust implementation
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

    // Determine calculation parameters based on quality
    const loopNum = highQuality ? 100 : 1;
    const pointsToCalculate = highQuality ? iterations : 40000;
    const drawAt = highQuality
      ? Math.floor(pointsToCalculate / 20)
      : pointsToCalculate;

    console.log(
      "Rust High Quality - loopNum:",
      loopNum,
      "drawAt:",
      drawAt,
      "pointsToCalculate:",
      pointsToCalculate,
    );

    // Create calculation context for Rust function
    const calculationContext = {
      attractorParams,
      densityBuffer,
      infoBuffer,
      imageBuffer,
      highQuality,
      pointsToCalculate,
      width,
      height,
      x: 0,
      y: 0,
      loopNum,
      drawAt,
    };

    // Call the Rust WebAssembly function
    const result = calculate_attractor_loop(calculationContext);

    // Check for errors in the result
    if (result.error) {
      throw new Error(result.error);
    }

    // Check the info buffer for completion status
    const info = new Uint32Array(infoBuffer);

    // Check if calculation was cancelled
    if (!info[1]) {
      const calculationTime = performance.now() - start;
      console.log(
        `Rust ${highQuality ? "High" : "Low"} Quality calc done in ${calculationTime.toFixed(2)}ms`,
      );

      // Mark as done
      info[2] = 1;

      // Send completion message with performance data
      self.postMessage({
        type: "done",
        performance: {
          calculationTime,
          pointsCalculated: result.pointsAdded || pointsToCalculate,
          quality: highQuality ? "high" : "low",
          implementation: "rust",
        },
      });
    } else {
      console.log("Rust calculation was cancelled");
      self.postMessage({ type: "cancelled" });
    }
  } catch (error) {
    console.error("Error in Rust attractor calculation:", error);
    self.postMessage({
      type: "error",
      message: "Error calculating attractor with Rust WebAssembly",
      error: error.toString(),
      stack: error.stack,
    });
  }
}

// Report that the worker is ready
self.postMessage({ type: "ready", implementation: "rust" });
