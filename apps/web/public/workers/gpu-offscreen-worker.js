// GPU.js OffscreenCanvas Worker
// This worker uses GPU.js for parallel computation with OffscreenCanvas

// Suppress Acorn version warnings
const originalWarn = console.warn;
console.warn = function (message) {
  if (
    typeof message === "string" &&
    message.includes("options.ecmaVersion is required")
  ) {
    return; // Suppress this specific warning
  }
  originalWarn.apply(console, arguments);
};

// Load GPU.js from local file
importScripts("./gpu-browser.min.js");

let gpu = null;
let offscreenCanvas = null;
let ctx = null;

const initGPU = () => {
  try {
    // Initialize GPU with specific options to avoid Acorn warnings
    gpu = new GPU.GPU({
      mode: "gpu",
    });
    console.log("GPU.js initialized successfully in worker");
    return true;
  } catch (error) {
    console.error("GPU.js initialization failed in worker:", error);
    return false;
  }
};

const initCanvas = (canvas, width, height) => {
  offscreenCanvas = canvas;
  canvas.width = width;
  canvas.height = height;
  ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Failed to get 2D context from OffscreenCanvas");
  }

  return true;
};

const createAttractorKernel = (params, pointCount) => {
  if (!gpu) throw new Error("GPU not initialized");

  return gpu
    .createKernel(function () {
      // Give each thread a slightly different starting point
      let x = (this.thread.x / this.output.x - 0.5) * 0.01;
      let y = (this.thread.x / this.output.x - 0.5) * 0.01;

      for (let i = 0; i < this.constants.iterations; i++) {
        const newX =
          Math.sin(this.constants.a * y) +
          this.constants.c * Math.cos(this.constants.a * x);
        const newY =
          Math.sin(this.constants.b * x) +
          this.constants.d * Math.cos(this.constants.b * y);
        x = newX;
        y = newY;
      }

      return [x, y];
    })
    .setConstants({
      a: params.a,
      b: params.b,
      c: params.c,
      d: params.d,
      iterations: 10000,
    })
    .setOutput([pointCount]);
};

const renderToCanvas = (points, width, height, scale) => {
  if (!ctx) throw new Error("Canvas context not available");

  // Clear canvas
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, width, height);

  // Create ImageData for efficient pixel manipulation
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  points.forEach(([x, y]) => {
    const px = Math.floor(width / 2 + x * scale);
    const py = Math.floor(height / 2 + y * scale);

    if (px >= 0 && px < width && py >= 0 && py < height) {
      const index = (py * width + px) * 4;
      // Cyan color with additive blending
      data[index] = Math.min(255, (data[index] || 0) + 0); // R
      data[index + 1] = Math.min(255, (data[index + 1] || 0) + 255); // G
      data[index + 2] = Math.min(255, (data[index + 2] || 0) + 255); // B
      data[index + 3] = Math.min(255, (data[index + 3] || 0) + 80); // A
    }
  });

  ctx.putImageData(imageData, 0, 0);
};

const computeAttractor = async (payload) => {
  const { params, width, height, pointCount } = payload;

  if (!gpu || !offscreenCanvas || !ctx) {
    throw new Error("Worker not properly initialized");
  }

  const startTime = performance.now();

  try {
    // Create and execute GPU kernel
    const computationStart = performance.now();
    const kernel = createAttractorKernel(params, pointCount);
    const points = kernel();
    const computationTime = performance.now() - computationStart;

    // Render directly to offscreen canvas - this will show on main thread automatically
    const renderStart = performance.now();
    renderToCanvas(points, width, height, params.scale * 80); // Enlarge the image scale 80x
    const renderTime = performance.now() - renderStart;

    const totalTime = performance.now() - startTime;

    // Send only performance data back - no bitmap transfer needed!
    self.postMessage({
      type: "COMPUTATION_COMPLETE",
      payload: {
        performance: {
          computation: computationTime,
          rendering: renderTime,
          total: totalTime,
        },
        pointCount,
      },
    });
  } catch (error) {
    self.postMessage({
      type: "COMPUTATION_ERROR",
      payload: { error: error.message },
    });
  }
};

// Worker message handler
self.onmessage = async (event) => {
  const { type, payload } = event.data;

  try {
    switch (type) {
      case "INIT_CANVAS":
        const { canvas, width, height } = payload;

        // Initialize GPU if not already done
        if (!gpu) {
          const gpuInitialized = initGPU();
          if (!gpuInitialized) {
            self.postMessage({
              type: "INIT_ERROR",
              payload: { error: "Failed to initialize GPU.js" },
            });
            return;
          }
        }

        // Initialize canvas
        initCanvas(canvas, width, height);

        self.postMessage({
          type: "INIT_COMPLETE",
          payload: { success: true },
        });
        break;

      case "COMPUTE_ATTRACTOR":
        await computeAttractor(payload);
        break;

      default:
        console.warn("Unknown message type:", type);
    }
  } catch (error) {
    self.postMessage({
      type: "ERROR",
      payload: {
        error: error.message,
        originalType: type,
      },
    });
  }
};

// Signal that worker is ready
self.postMessage({
  type: "WORKER_READY",
  payload: { timestamp: Date.now() },
});
