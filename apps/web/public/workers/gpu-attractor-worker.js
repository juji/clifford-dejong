/**
 * Simple GPU.js attractor worker
 */

// Import GPU.js and our existing attractor functions
importScripts("./gpu-browser.min.js");
importScripts("./calculate-attractor-loop.js");

// Default parameters
let params = {
  attractor: "clifford",
  a: 2,
  b: -2,
  c: 1,
  d: -1,
  hue: 333,
  saturation: 100,
  brightness: 100,
  background: [0, 0, 0, 255],
  scale: 1,
  left: 0,
  top: 0,
};

// Initialize GPU
const gpu = new GPU.GPU();

// Check if GPU is available
const isGpu = gpu.mode === "gpu";

const clifford = AttractorCalc.clifford;
const smoothing = AttractorCalc.smoothing;

// Add the clifford and smoothing functions to GPU.js
gpu.addFunction(clifford);

// We need to create a GPU-compatible version of smoothing since Math.random() isn't available in GPU.js
gpu.addFunction(function gpuSmoothing(num, scale, threadX, threadY, iteration) {
  // Create a deterministic but varied pseudo-random value using thread position and iteration
  // This formula creates values between 0 and 1 that vary based on inputs
  const pseudoRandom =
    Math.sin(
      num * 12.9898 + threadX * 78.233 + threadY * 43.7221 + iteration * 3.1415,
    ) *
      0.5 +
    0.5;

  // Apply similar logic as original smoothing function
  const factor = 0.2;
  return num + (pseudoRandom < 0.5 ? -factor : factor) * (1.0 / scale);
});

// Create clifford attractor kernel
// Each thread calculates a point based on a different initial x,y
const cliffordKernel = gpu
  .createKernel(function (a, b, c, d, iterations, scale, width, height) {
    // Each thread gets a slightly different starting position
    // Use wider range of starting values for better coverage
    let x = -0.75 + (1.5 * this.thread.x) / this.output.x;
    let y = -0.75 + (1.5 * this.thread.y) / this.output.y;

    // Skip the first few iterations which are usually transient
    for (let i = 0; i < 20; i++) {
      const result = clifford(x, y, a, b, c, d);
      x = result[0];
      y = result[1];
    }

    // Run the iterations that we'll actually keep
    for (let i = 0; i < iterations; i++) {
      // Calculate next point using clifford attractor
      const result = clifford(x, y, a, b, c, d);

      // Apply smoothing to add variety to the trajectories
      x = gpuSmoothing(result[0], scale, this.thread.x, this.thread.y, i);
      y = gpuSmoothing(
        result[1],
        scale,
        this.thread.y,
        this.thread.x,
        i + 10000,
      );
    }

    // Calculate screen coordinates like in accumulateDensity
    const screenX = x * scale;
    const screenY = y * scale;
    const centerX = width / 2.0;
    const centerY = height / 2.0;
    const px = Math.floor(centerX + screenX);
    const py = Math.floor(centerY + screenY);

    return [px, py];
  })
  .setOutput([4000, 5000]); // 4000 * 5000 = 20 million pairs

// No longer need a separate density texture initialization kernel
// We now use a pure JS array for accumulating results from batch processing

// Note: We're now using a simpler CPU-based approach for density accumulation
// The GPU-based approach would be better for larger datasets, but for our current needs,
// the direct CPU accumulation is more straightforward and avoids kernel argument issues

// No longer need a separate kernel to read density values
// We accumulate them directly in JavaScript

/**
 * Calculate density map from point coordinates
 * @param {Array<Array<[number, number]>>} pointsArray - 2D array of points with screen coordinates
 * @param {number} pointsWidth - Width of the points array
 * @param {number} pointsHeight - Height of the points array
 * @param {number} canvasWidth - Width of the target canvas
 * @param {number} canvasHeight - Height of the target canvas
 * @returns {Uint32Array} - 1D density array where each element represents a pixel
 */
function calculateDensityArray(
  pointsArray,
  pointsWidth,
  pointsHeight,
  canvasWidth,
  canvasHeight,
) {
  console.log(`Processing ${pointsWidth * pointsHeight} points for density...`);

  // Initialize density array with zeros (using Uint32Array for better performance)
  const densityArray = new Uint32Array(canvasWidth * canvasHeight);

  // Process all points and increment density directly
  for (let i = 0; i < pointsHeight; i++) {
    for (let j = 0; j < pointsWidth; j++) {
      const point = pointsArray[i][j];
      const x = point[0];
      const y = point[1];

      // If the point is within bounds, increment the density at that position
      if (x >= 0 && x < canvasWidth && y >= 0 && y < canvasHeight) {
        // Convert 2D coordinates to 1D index: y * width + x
        const idx = y * canvasWidth + x;
        densityArray[idx]++;
      }
    }
  }

  return densityArray;
}

/**
 * Create image data from density array
 * This is a direct adaptation of the createImageData function from calculate-attractor-loop.js
 * but using our density array as input
 *
 * @param {Uint32Array} densityArray - Array of density values
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {Object} params - Parameters for coloring (hue, saturation, brightness)
 * @param {boolean} highQuality - Whether to use high quality coloring
 * @returns {Uint32Array} - Array of 32-bit RGBA color values
 */
function createImageData(
  densityArray,
  width,
  height,
  params,
  highQuality = true,
) {
  console.log(`Creating image data from density array (${width}x${height})...`);

  // Find the maximum density for normalization
  let maxDensity = 1;
  for (let i = 0; i < densityArray.length; i++) {
    if (densityArray[i] > maxDensity) {
      maxDensity = densityArray[i];
    }
  }

  console.log(`Maximum density: ${maxDensity}`);

  // Extract parameters with defaults
  const hue = params.hue !== undefined ? params.hue : 200;
  const saturation = params.saturation !== undefined ? params.saturation : 70;
  const brightness = params.brightness !== undefined ? params.brightness : 90;
  const background = params.background || [0, 0, 0, 255]; // Default: black

  // Initialize our output image array
  const imageArray = new Uint32Array(width * height);

  // Setup background color
  let bgColor = 0;
  if (background && background.length > 0) {
    const bgA = background.length > 3 ? background[3] : 255;
    const bgB = background.length > 2 ? background[2] : 0;
    const bgG = background.length > 1 ? background[1] : 0;
    const bgR = background[0];
    bgColor = (bgA << 24) | (bgB << 16) | (bgG << 8) | bgR;
  }

  // Process each pixel
  const loopLimit = width * height;
  for (let i = 0; i < loopLimit; i++) {
    const dval = densityArray[i];

    if (dval > 0) {
      let colorData;
      if (highQuality) {
        // Use the existing AttractorCalc.getColorData function directly
        // This ensures we match exactly the same algorithm as the original
        colorData = AttractorCalc.getColorData(
          dval, // Current density value
          maxDensity, // Maximum density in the image
          hue, // Color hue
          saturation, // Color saturation
          brightness, // Color brightness
          1.0, // Progress (fully rendered)
          background, // Background color
        );
      } else {
        // Use the low quality point color function for faster rendering
        colorData = AttractorCalc.getLowQualityPoint(
          hue,
          saturation,
          brightness,
        );
      }
      imageArray[i] = colorData;
    } else {
      // Zero density gets the background color
      imageArray[i] = bgColor;
    }
  }

  return imageArray;
}

// Variables to store canvas and context
let offscreenCanvas = null;
let canvasCtx = null;

// Handle messages from main thread
self.onmessage = function (e) {
  const data = e.data;

  if (data.type === "init") {
    // Send back initialization result
    self.postMessage({
      type: "init",
      success: true,
      gpuMode: isGpu,
    });
  } else if (data.type === "resize") {
    // Handle resize events if we have the canvas
    if (offscreenCanvas && canvasCtx) {
      console.log(`Window resized to ${data.width}x${data.height}`);

      // Update params without trying to resize the canvas itself
      params.width = data.width;
      params.height = data.height;

      // Re-run the attractor calculation with new dimensions
      self.postMessage({
        type: "resizing",
        width: data.width,
        height: data.height,
      });

      // Trigger a new calculation with updated dimensions
      try {
        // Run with updated dimensions
        self.onmessage({
          data: {
            type: "runClifford",
            params: {
              ...params,
              width: data.width,
              height: data.height,
            },
          },
        });
      } catch (error) {
        console.error("Error recalculating after resize:", error);
      }
    }
  } else if (data.type === "runClifford") {
    // Check if canvas was transferred
    if (data.canvas) {
      console.log("Received canvas transfer in worker");
      offscreenCanvas = data.canvas;
      canvasCtx = offscreenCanvas.getContext("2d");
    }
    try {
      const startTime = performance.now();

      // Update parameters if provided in the message
      if (data.params) {
        params = { ...params, ...data.params };
      }

      // Get canvas dimensions from params
      const width = params.width || 800;
      const height = params.height || 600;

      // Define points dimensions
      const pointsWidth = 4000;
      const pointsHeight = 5000;

      // Run the first kernel to calculate attractor points
      console.log("Calculating attractor points...");
      const pointsStartTime = performance.now();

      // Use the params values with their proper defaults
      const pointsResult = cliffordKernel(
        params.a,
        params.b,
        params.c,
        params.d,
        params.iterations || 100, // iterations per point (use param if provided, otherwise default)
        params.scale || 100, // scale for smoothing (use param if provided, otherwise default)
        width,
        height,
      );

      const pointsEndTime = performance.now();
      const pointsTime = pointsEndTime - pointsStartTime;
      console.log(
        `Calculated 20 million Clifford points in ${pointsTime.toFixed(2)}ms`,
      );

      // Use our function to calculate the density map
      console.log("Creating density map...");
      const densityStartTime = performance.now();

      // Calculate density array using our dedicated function
      const densityArray = calculateDensityArray(
        pointsResult, // The 2D array of points from the cliffordKernel
        pointsWidth, // Width dimension of the points array
        pointsHeight, // Height dimension of the points array
        width, // Canvas width
        height, // Canvas height
      );

      const densityEndTime = performance.now();
      const densityTime = densityEndTime - densityStartTime;
      console.log(`Created density map in ${densityTime.toFixed(2)}ms`);

      // Create image data using GPU and time it
      console.log("Creating image data from density...");
      const imageStartTime = performance.now();

      // Generate image data using the createImageData function
      const imageArray = createImageData(
        densityArray, // Density values for each pixel
        width, // Canvas width
        height, // Canvas height
        params, // Color parameters (hue, saturation, brightness)
        true, // Use high quality rendering
      );

      const imageEndTime = performance.now();
      const imageTime = imageEndTime - imageStartTime;
      console.log(`Created image data in ${imageTime.toFixed(2)}ms`);
      console.log(`Created image data in ${imageTime.toFixed(2)}ms`);

      // Total execution time
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(`Total execution time: ${totalTime.toFixed(2)}ms`);
      console.log(`Mode: ${isGpu ? "GPU" : "CPU"}`);

      // Sample a few values from both results for debugging
      const pointSamples = [];
      for (let i = 0; i < 5; i++) {
        const x = Math.floor(Math.random() * pointsWidth);
        const y = Math.floor(Math.random() * pointsHeight);
        pointSamples.push({
          pos: [x, y],
          value: pointsResult[y][x], // [px, py] screen coordinates
        });
      }

      const densitySamples = [];
      for (let i = 0; i < 5; i++) {
        const x = Math.floor(Math.random() * width);
        const y = Math.floor(Math.random() * height);
        densitySamples.push({
          pos: [x, y],
          value: densityArray[y * width + x], // Density count from 1D array
        });
      }

      // Check if we have an offscreen canvas to draw to
      let drawnToCanvas = false;
      let drawTime = 0;

      if (offscreenCanvas && canvasCtx) {
        console.log("Drawing directly to offscreen canvas...");
        const drawStartTime = performance.now();

        // Convert our Uint32Array to an ImageData object
        // We need to convert from the 32-bit RGBA packed format to a Uint8ClampedArray
        const imageData = new ImageData(
          new Uint8ClampedArray(imageArray.buffer),
          width,
          height,
        );

        // Draw directly to the canvas
        canvasCtx.putImageData(imageData, 0, 0);

        drawTime = performance.now() - drawStartTime;
        drawnToCanvas = true;
        console.log(`Drew to offscreen canvas in ${drawTime.toFixed(2)}ms`);
      }

      // Send the timing result and image data back to the main thread
      self.postMessage({
        type: "cliffordResult",
        pointsTime,
        densityTime,
        imageTime,
        drawTime,
        totalTime: totalTime + drawTime,
        pointsPerSecond: (20000000 / (pointsTime / 1000)).toFixed(0),
        pointSamples,
        densitySamples,
        // Only send image data if we didn't draw to canvas directly
        imageArray: drawnToCanvas ? null : imageArray,
        width,
        height,
        drawnToCanvas,
        gpuMode: isGpu,
      });
    } catch (error) {
      console.error("Error running Clifford kernel:", error);
      self.postMessage({
        type: "error",
        message: error.message,
      });
    }
  }
};

// Send ready message when worker loads
self.postMessage({ type: "ready" });
