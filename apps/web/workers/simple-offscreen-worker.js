// Simple GPU worker without external dependencies
// This worker implements basic parallel computation without GPU.js for better compatibility

let offscreenCanvas = null;
let ctx = null;

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

// CPU-based parallel computation using multiple iterations
const computeAttractorPoints = (params, pointCount) => {
  const points = [];
  const { a, b, c, d } = params;

  for (let i = 0; i < pointCount; i++) {
    // Give each iteration a slightly different starting point
    let x = (i / pointCount - 0.5) * 0.01;
    let y = (i / pointCount - 0.5) * 0.01;

    // Iterate the Clifford attractor equations
    for (let j = 0; j < 10000; j++) {
      const newX = Math.sin(a * y) + c * Math.cos(a * x);
      const newY = Math.sin(b * x) + d * Math.cos(b * y);
      x = newX;
      y = newY;
    }

    points.push([x, y]);
  }

  return points;
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

  if (!offscreenCanvas || !ctx) {
    throw new Error("Worker not properly initialized");
  }

  const startTime = performance.now();

  try {
    // Compute points on CPU (still off-main-thread)
    const computationStart = performance.now();
    const points = computeAttractorPoints(params, pointCount);
    const computationTime = performance.now() - computationStart;

    // Render to offscreen canvas
    const renderStart = performance.now();
    renderToCanvas(points, width, height, params.scale);
    const renderTime = performance.now() - renderStart;

    const totalTime = performance.now() - startTime;

    // Transfer the canvas back to main thread
    const bitmap = offscreenCanvas.transferToImageBitmap();

    // Send results back to main thread
    self.postMessage(
      {
        type: "COMPUTATION_COMPLETE",
        payload: {
          bitmap,
          performance: {
            computation: computationTime,
            rendering: renderTime,
            total: totalTime,
          },
          pointCount,
        },
      },
      { transfer: [bitmap] },
    );
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
