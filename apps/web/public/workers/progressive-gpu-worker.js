// Progressive GPU.js attractor worker
importScripts("./gpu-browser.min.js");
importScripts("./calculate-attractor-loop.js");

// Initialize GPU
const gpu = new GPU.GPU();

// Check if GPU is available
const isGpu = gpu.mode === "gpu";

// Import clifford attractor function from AttractorCalc
const clifford = AttractorCalc.clifford;

// Add the clifford function to GPU.js
gpu.addFunction(clifford);

// Add smoothing function for GPU.js
gpu.addFunction(function gpuSmoothing(num, scale, threadX, threadY, iteration) {
  // Use a better pseudo-random number generation that more closely matches Math.random()
  // This algorithm uses multiple sin operations with different prime multipliers to reduce patterns
  const pseudoRandom =
    (Math.sin(threadX * 12.9898 + threadY * 78.233 + iteration * 3.1415) *
      43758.5453123 +
      Math.sin(threadY * 39.346 + threadX * 11.789 + (iteration + 10) * 7.643) *
        22189.6876423) %
    1.0;

  // Ensure it's in the 0 to 1 range
  const normalizedRandom = Math.abs(pseudoRandom);

  // Apply the exact same logic as original smoothing function
  const factor = 0.2;
  return num + (normalizedRandom < 0.5 ? -factor : factor) * (1.0 / scale);
});

// can't call from here
// gpu.addFunction(function cliffordWithSmoothing(x,y,a,b,c,d,scale){
//   const result = clifford(x,y,a,b,c,d);
//   const smoothedX = gpuSmoothing(result[0], scale, this.thread.x, this.thread.y, 0);
//   const smoothedY = gpuSmoothing(result[1], scale, this.thread.x, this.thread.y, 0);
//   return [smoothedX, smoothedY];
// });

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
  scale: 100,
  left: 0,
  top: 0,
};

// Variables to store canvas and context
let offscreenCanvas = null;
let canvasCtx = null;

// Variables to track progressive rendering state
let currentStage = 0; // Current rendering stage (0: not started, 1+: stage number)
let accumulatedDensity = null; // Accumulated density map across stages
let lastParams = null; // Last used parameters to detect changes
let renderId = 0; // Unique ID for the current rendering job (increases when params change)
let stagePoints = [2000000, 8000000, 10000000]; // Default points per stage if not provided
let stageKernels = []; // Store dynamically created kernels
let totalPoints = 0; // Total points across all stages

// Create a function that returns a configured kernel with the desired output size
function createCliffordKernel(outputWidth, outputHeight) {
  return gpu
    .createKernel(function (a, b, c, d, iterations, scale, width, height) {
      // Use more randomized starting positions for better distribution
      // Create highly varied starting points based on thread coordinates
      let x = Math.sin(this.thread.x * 0.3171 + this.thread.y * 0.1543) * 0.45;
      let y = Math.cos(this.thread.y * 0.2779 + this.thread.x * 0.1237) * 0.45;

      // Do not skip initial iterations - this matches the original implementation
      // which uses all points in the trajectory

      // Run all iterations
      for (let i = 0; i < iterations; i++) {
        // Calculate next point using clifford attractor
        const result = clifford(x, y, a, b, c, d);

        // Apply smoothing with the improved random function
        // Use unique seeds for each point to get a good distribution
        x = gpuSmoothing(
          result[0],
          scale,
          this.thread.x + i * 0.01,
          this.thread.y,
          i,
        );
        y = gpuSmoothing(
          result[1],
          scale,
          this.thread.y + i * 0.01,
          this.thread.x,
          i + 100,
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
    .setOutput([outputWidth, outputHeight]);
}

// We'll create kernels dynamically based on the requested points

/**
 * Calculate density map from point coordinates
 * @param {Array<Array<[number, number]>>} pointsArray - 2D array of points with screen coordinates
 * @param {number} pointsWidth - Width of the points array
 * @param {number} pointsHeight - Height of the points array
 * @param {number} canvasWidth - Width of the target canvas
 * @param {number} canvasHeight - Height of the target canvas
 * @param {Uint32Array} [existingDensity] - Optional existing density array to update
 * @returns {Uint32Array} - 1D density array where each element represents a pixel
 */
function calculateDensityArray(
  pointsArray,
  pointsWidth,
  pointsHeight,
  canvasWidth,
  canvasHeight,
  existingDensity = null,
) {
  console.log(`Processing ${pointsWidth * pointsHeight} points for density...`);

  // Initialize or reuse density array
  const densityArray =
    existingDensity || new Uint32Array(canvasWidth * canvasHeight);

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
        densityArray[idx] += 1;
      }
    }
  }

  return densityArray;
}

// We'll use AttractorCalc's original methods for consistency

/**
 * Process one stage of the progressive rendering
 * @param {number} stage - The stage to process (1-based index)
 * @param {object} params - The rendering parameters
 */
async function processStage(stage, params) {
  const startTime = performance.now();

  // Get canvas dimensions from params
  const width = params.width || 800;
  const height = params.height || 600;

  // Make sure we have a valid stage index (1-based)
  const stageIndex = Math.max(1, Math.min(stage, stagePoints.length));
  const pointsForStage = stagePoints[stageIndex - 1];

  // Calculate progress as accumulated points / total points
  let accumulatedPointsBeforeStage = 0;
  for (let i = 0; i < stageIndex - 1; i++) {
    accumulatedPointsBeforeStage += stagePoints[i];
  }

  // Get or create the kernel for this stage
  if (!stageKernels[stageIndex - 1]) {
    // Calculate dimensions to achieve the desired point count
    // We want to keep aspect ratio close to 2:1 (width:height)
    const totalPixels = pointsForStage;

    // Limit dimensions based on hardware - GPUs have size limits
    const maxDimension = 8192; // Typical GPU max texture size

    // Calculate height and width with 2:1 aspect ratio
    let targetHeight = Math.sqrt(totalPixels / 2);
    let targetWidth = targetHeight * 2;

    // If the dimensions are too large, reduce them
    if (targetHeight > maxDimension || targetWidth > maxDimension) {
      console.warn(
        `Target dimensions ${targetWidth}x${targetHeight} exceed GPU limits, scaling down`,
      );
      const scale = Math.min(
        maxDimension / targetWidth,
        maxDimension / targetHeight,
      );
      targetWidth *= scale;
      targetHeight *= scale;
    }

    // Round to nearest whole number
    const kernelHeight = Math.round(targetHeight);
    const kernelWidth = Math.round(targetWidth);

    console.log(
      `Creating kernel for stage ${stageIndex} with dimensions ${kernelWidth}x${kernelHeight} (${kernelWidth * kernelHeight} points)`,
    );
    stageKernels[stageIndex - 1] = createCliffordKernel(
      kernelWidth,
      kernelHeight,
    );
  }

  const kernel = stageKernels[stageIndex - 1];
  const kernelDimensions = kernel.output;
  const pointsWidth = kernelDimensions[0];
  const pointsHeight = kernelDimensions[1];
  const stagePointCount = pointsWidth * pointsHeight;

  console.log(
    `Stage ${stageIndex}/${stagePoints.length}: Processing ${stagePointCount.toLocaleString()} points...`,
  );

  // Calculate progress as percentage of total points
  const accumulatedPoints = accumulatedPointsBeforeStage + stagePointCount;
  const progress = accumulatedPoints / totalPoints;

  // Run the kernel to calculate points
  const pointsStartTime = performance.now();
  const pointsResult = kernel(
    params.a,
    params.b,
    params.c,
    params.d,
    // params.iterations || 100,
    100 + Math.round(Math.random() * 500),
    params.scale || 100,
    width,
    height,
  );
  const pointsTime = performance.now() - pointsStartTime;
  console.log(`Points calculated in ${pointsTime.toFixed(2)}ms`);

  // Calculate or update density map
  const densityStartTime = performance.now();
  accumulatedDensity = calculateDensityArray(
    pointsResult,
    pointsWidth,
    pointsHeight,
    width,
    height,
    accumulatedDensity, // Pass the existing density if we have it
  );

  const densityTime = performance.now() - densityStartTime;
  console.log(`Density map updated in ${densityTime.toFixed(2)}ms`);

  // Create image data
  const imageStartTime = performance.now();

  // Find the maximum density for normalization
  let maxDensity = 1;
  for (let i = 0; i < accumulatedDensity.length; i++) {
    if (accumulatedDensity[i] > maxDensity) {
      maxDensity = accumulatedDensity[i];
    }
  }

  console.log(`Maximum density: ${maxDensity}`);

  // Create new image array
  const imageArray = new Uint32Array(width * height);

  // Set default background color
  const bgColor =
    params.background && params.background.length > 0
      ? ((params.background[3] || 255) << 24) |
        ((params.background[2] || 0) << 16) |
        ((params.background[1] || 0) << 8) |
        (params.background[0] || 0)
      : 255 << 24; // Black with full alpha

  // Fill with background color first
  for (let i = 0; i < width * height; i++) {
    imageArray[i] = bgColor;
  }

  // Process density values - using exactly the same color mapping approach as the original
  for (let i = 0; i < accumulatedDensity.length; i++) {
    const dval = accumulatedDensity[i];
    if (dval > 0) {
      // Use AttractorCalc's getColorData function for consistency
      // Ensure we're using the exact params from the request, or default identical to the original
      const colorData = AttractorCalc.getColorData(
        dval,
        maxDensity,
        params.hue || 200,
        params.saturation || 80,
        params.brightness || 90,
        1.0, // Progress (fully rendered)
        params.background || [0, 0, 0, 255],
      );
      imageArray[i] = colorData;
    }
  }

  const imageTime = performance.now() - imageStartTime;
  console.log(`Image data created in ${imageTime.toFixed(2)}ms`);

  // Draw to canvas if available
  let drawnToCanvas = false;
  let drawTime = 0;

  if (offscreenCanvas && canvasCtx) {
    const drawStartTime = performance.now();

    try {
      // Convert to ImageData
      const imageData = new ImageData(
        new Uint8ClampedArray(imageArray.buffer),
        width,
        height,
      );

      // Draw to canvas
      canvasCtx.putImageData(imageData, 0, 0);

      drawTime = performance.now() - drawStartTime;
      drawnToCanvas = true;
      console.log(`Drew to canvas in ${drawTime.toFixed(2)}ms`);
    } catch (error) {
      console.error("Error drawing to canvas:", error);
      drawnToCanvas = false;
    }
  }

  // Calculate timings
  const totalTime = performance.now() - startTime;
  const pointsPerSecond = Math.round(totalPoints / (pointsTime / 1000));

  // Use accumulated points from earlier calculation
  // No need to recalculate as we already did it above

  // Send progress report to main thread
  self.postMessage({
    type: "progress",
    stage: stage,
    progress: progress,
    pointsTime: pointsTime,
    densityTime: densityTime,
    imageTime: imageTime,
    drawTime: drawTime,
    totalTime: totalTime,
    accumulatedPoints: accumulatedPointsBeforeStage + stagePointCount,
    pointsPerSecond: pointsPerSecond.toString(),
    renderId: renderId,
    width: width,
    height: height,
    drawnToCanvas: drawnToCanvas,
    gpuMode: isGpu,
    totalPoints: totalPoints,
    stagePointCount: stagePointCount,
  });

  return { pointsTime, densityTime, imageTime, totalTime };
}

/**
 * Process all stages sequentially
 * @param {Object} params - The rendering parameters
 * @param {Array<number>} [customStagePoints] - Optional array of points per stage
 */
async function processAllStages(params, customStagePoints) {
  try {
    // Reset accumulated state if parameters changed
    const paramsChanged =
      lastParams === null ||
      lastParams.width !== params.width ||
      lastParams.height !== params.height ||
      lastParams.a !== params.a ||
      lastParams.b !== params.b ||
      lastParams.c !== params.c ||
      lastParams.d !== params.d ||
      lastParams.scale !== params.scale;

    if (paramsChanged) {
      console.log("Parameters changed, resetting progressive rendering");
      currentStage = 0;
      accumulatedDensity = null;
      renderId++; // Increment job ID
      stageKernels = []; // Clear kernel cache
    }

    // Store the current parameters
    lastParams = { ...params };

    // Update stagePoints if custom points are provided
    if (
      customStagePoints &&
      Array.isArray(customStagePoints) &&
      customStagePoints.length > 0
    ) {
      stagePoints = [...customStagePoints];
    }

    // Calculate total points across all stages
    totalPoints = stagePoints.reduce((sum, points) => sum + points, 0);

    console.log(
      `Processing ${stagePoints.length} stages with point counts: [${stagePoints.join(", ")}]`,
    );
    console.log(`Total points: ${totalPoints.toLocaleString()}`);

    // Process each stage sequentially
    let finalResult;
    for (let i = 0; i < stagePoints.length; i++) {
      // Current stage (1-based index)
      currentStage = i + 1;

      // Process this stage
      const result = await processStage(currentStage, params);
      finalResult = result;

      // Wait a bit between stages for UI updates
      if (i < stagePoints.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }

    // Send the final result
    self.postMessage({
      type: "result",
      ...finalResult,
      renderId: renderId,
      pointsPerSecond: (totalPoints / (finalResult.pointsTime / 1000)).toFixed(
        0,
      ),
      totalPoints: totalPoints,
      gpuMode: isGpu,
    });
  } catch (error) {
    console.error("Error in progressive rendering:", error);
    self.postMessage({
      type: "error",
      message: error.message,
      renderId: renderId,
    });
  }
}

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
        // Reset state for new dimensions
        currentStage = 0;
        accumulatedDensity = null;
        renderId++;
        stageKernels = []; // Clear kernel cache

        // Start progressive rendering with updated dimensions
        processAllStages(
          {
            ...params,
            width: data.width,
            height: data.height,
          },
          stagePoints,
        ); // Keep the same stage points
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

    // Update parameters if provided
    if (data.params) {
      params = { ...params, ...data.params };
    }

    // Get custom stage points if provided
    const customStagePoints =
      data.stagePoints && Array.isArray(data.stagePoints)
        ? data.stagePoints
        : null;

    // Start progressive rendering with custom stage points
    processAllStages(params, customStagePoints);
  }
};

// Send ready message
self.postMessage({ type: "ready" });
