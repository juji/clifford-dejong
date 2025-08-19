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
        console.error(error);
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
      performAttractorDraw(data);
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

let rafs = [];

/**
 * Performs the attractor calculation using WebAssembly
 * This function handles the main calculation loop and reports progress
 * @param {Object} data - The calculation parameters
 */
async function performAttractorDraw(data) {
  try {
    // first, remove all rafs
    rafs.forEach((raf) => cancelAnimationFrame(raf));
    rafs = [];

    const {
      width = 800,
      height = 800,
      highQuality = true,
      background = [0, 0, 0, 255],
      imageBuffer = new SharedArrayBuffer(width * height * 4),
      infoBuffer = new SharedArrayBuffer(4 * 4), // uint32: maxDensity, cancel, done, progress (0-100)
    } = data;

    // Call the WebAssembly function
    const start = performance.now();
    console.log("Starting attractor drawing with data:", data);

    const info = new Uint32Array(infoBuffer);
    const ctx = offscreenCanvas.getContext("2d");
    ctx.clearRect(0, 0, width, height);
    const imageData = ctx.createImageData(width, height);
    const dst = new Uint32Array(imageData.data.buffer);
    const imageView = new Uint32Array(imageBuffer);

    let progress = 0;

    const bg =
      ((background[3] || 255) << 24) |
      ((background[2] || 0) << 16) |
      ((background[1] || 0) << 8) |
      (background[0] || 0);

    function initializeDestination() {
      // fill with background
      for (let j = 0; j < imageView.length; j++) {
        dst[j] = bg;
      }
      ctx.putImageData(imageData, 0, 0);
    }

    // Replace the transition buffer section with this:
    // Add tracking for final passes
    let finalPassCount = 0;
    let expectedFinalPasses = 0;
    let onEndTimeout = null;
    function transitionToNewImage(onEnd) {
      const totalPixels = imageView.length;
      let currentPixel = 0;
      expectedFinalPasses++;

      function updateGlitch() {
        // Create fewer but much larger glitchy blocks with displacement
        for (let i = 0; i < 2; i++) {
          // Fewer blocks per frame
          const blockStart = Math.floor(Math.random() * totalPixels);
          const blockSize = Math.floor(Math.random() * 3000) + 1000; // Much larger blocks (1000-4000 pixels)
          const blockEnd = Math.min(blockStart + blockSize, totalPixels);

          for (
            let j = blockStart;
            j < blockEnd && currentPixel < totalPixels;
            j++
          ) {
            const sourcePixel = imageView[j];

            // Only displace non-background pixels
            if (sourcePixel !== bg) {
              // Calculate displacement offset
              const displaceX = Math.floor(Math.random() * 20) - 10; // ±10 pixels horizontally
              const displaceY = Math.floor(Math.random() * 20) - 10; // ±10 pixels vertically

              // Convert linear index to x,y coordinates
              const originalX = j % width;
              const originalY = Math.floor(j / width);

              // Calculate displaced position
              const newX = originalX + displaceX;
              const newY = originalY + displaceY;

              // Check bounds and place displaced pixel
              if (newX >= 0 && newX < width && newY >= 0 && newY < height) {
                const newIndex = newY * width + newX;
                dst[newIndex] = sourcePixel;
              }
            } else {
              // Background pixels go to their normal position
              dst[j] = sourcePixel;
            }

            currentPixel++;
          }
        }

        // Add chunky scan line corruption with displacement
        if (Math.random() < 0.4) {
          // 40% chance per frame
          const scanStartY = Math.floor(Math.random() * (height - 8));
          const scanHeight = Math.floor(Math.random() * 8) + 3;

          // Random horizontal displacement for the entire scan line
          const lineDisplaceX = Math.floor(Math.random() * 30) - 15; // ±15 pixels

          for (
            let y = scanStartY;
            y < Math.min(scanStartY + scanHeight, height);
            y++
          ) {
            for (let x = 0; x < width; x++) {
              const sourceIndex = y * width + x;
              const sourcePixel = imageView[sourceIndex];

              if (sourcePixel !== bg) {
                // Displace colored pixels
                const newX = x + lineDisplaceX;
                if (newX >= 0 && newX < width) {
                  const newIndex = y * width + newX;
                  dst[newIndex] = sourcePixel;
                }
              } else {
                // Background stays in place
                dst[sourceIndex] = sourcePixel;
              }
            }
          }
        }

        // Rectangular chunks with heavy displacement
        if (Math.random() < 0.2) {
          // 20% chance per frame
          const rectX = Math.floor(Math.random() * (width - 100));
          const rectY = Math.floor(Math.random() * (height - 100));
          const rectW = Math.floor(Math.random() * 150) + 50;
          const rectH = Math.floor(Math.random() * 100) + 30;

          // Heavy displacement for the entire chunk
          const chunkDisplaceX = Math.floor(Math.random() * 40) - 20; // ±20 pixels
          const chunkDisplaceY = Math.floor(Math.random() * 40) - 20; // ±20 pixels

          for (let y = rectY; y < Math.min(rectY + rectH, height); y++) {
            for (let x = rectX; x < Math.min(rectX + rectW, width); x++) {
              const sourceIndex = y * width + x;
              const sourcePixel = imageView[sourceIndex];

              if (sourcePixel !== bg) {
                // Displace the entire chunk
                const newX = x + chunkDisplaceX;
                const newY = y + chunkDisplaceY;

                if (newX >= 0 && newX < width && newY >= 0 && newY < height) {
                  const newIndex = newY * width + newX;
                  dst[newIndex] = sourcePixel;
                }
              } else {
                // Background pixels go to normal position
                dst[sourceIndex] = sourcePixel;
              }
            }
          }
        }

        ctx.putImageData(imageData, 0, 0);

        if (currentPixel < totalPixels) {
          rafs.push(requestAnimationFrame(updateGlitch));
        } else {
          // Ensure completion - final pass without displacement
          for (let j = 0; j < totalPixels; j++) {
            dst[j] = imageView[j];
          }
          ctx.putImageData(imageData, 0, 0);
          finalPassCount++;
          if (onEndTimeout) clearTimeout(onEndTimeout);
          onEndTimeout = setTimeout(() => {
            finalPassCount === expectedFinalPasses &&
              onEnd &&
              typeof onEnd === "function" &&
              onEnd();
          }, 33);
          // finalPassCount === expectedFinalPasses && onEnd && typeof onEnd === "function" && onEnd();
        }
      }

      rafs.push(requestAnimationFrame(updateGlitch));
    }

    function drawSimpleImage() {
      dst.set(imageView);
      ctx.putImageData(imageData, 0, 0);
    }

    let wait = true;
    while (wait) {
      if (info[3] === progress) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      } else {
        progress = info[3];
        self.postMessage({ type: "progress", progress });

        if (highQuality) {
          // occasionally cancel all animations
          // if(Math.random() < 0.2){
          //   rafs.forEach(raf => cancelAnimationFrame(raf));
          //   rafs = [];
          // }

          initializeDestination();
          transitionToNewImage(() => {
            if (finalPassCount === expectedFinalPasses) {
              console.log("All final passes completed");
              drawSimpleImage();
              self.postMessage({ type: "done", highQuality: true });
            }
          });
        } else {
          drawSimpleImage();
        }

        if (progress === 100) {
          console.log("draw done in", performance.now() - start, "ms");
          wait = false;

          if (!highQuality) {
            self.postMessage({ type: "done", highQuality: false });
          }
        }
      }
    }
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
