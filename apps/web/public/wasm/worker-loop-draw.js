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

    // Add tracking for final passes
    let finalPassCount = 0;
    let expectedFinalPasses = 0;
    let onEndTimeout = null;
    function finalizeTransition(onEnd) {
      // Ensure final image is perfect
      for (let j = 0; j < imageView.length; j++) {
        dst[j] = imageView[j];
      }
      ctx.putImageData(imageData, 0, 0);

      finalPassCount++;
      if (onEndTimeout) clearTimeout(onEndTimeout);
      onEndTimeout = setTimeout(() => {
        if (
          finalPassCount === expectedFinalPasses &&
          onEnd &&
          typeof onEnd === "function"
        ) {
          onEnd();
        }
      }, 33);
    }

    // Replace the transition buffer section with this:
    function transitionToNewImage(onEnd) {
      const particles = [];
      const numParticles = 800;
      expectedFinalPasses++;

      // Create particles from colored pixels
      for (let i = 0; i < numParticles; i++) {
        const randomIndex = Math.floor(Math.random() * imageView.length);
        if (imageView[randomIndex] !== bg) {
          particles.push({
            startIndex: randomIndex,
            currentIndex: randomIndex,
            velocity: {
              x: (Math.random() - 0.5) * 10,
              y: (Math.random() - 0.5) * 10,
            },
            life: Math.random() * 60 + 30, // 30-90 frames
            size: Math.floor(Math.random() * 2) + 1, // Random size from 1 to 2
          });
        }
      }

      let frameCount = 0;

      function updateParticles() {
        frameCount++;

        particles.forEach((particle) => {
          if (particle.life > 0) {
            // Move particle
            const oldX = particle.currentIndex % width;
            const oldY = Math.floor(particle.currentIndex / width);

            const newX = Math.floor(oldX + particle.velocity.x);
            const newY = Math.floor(oldY + particle.velocity.y);

            if (newX >= 0 && newX < width && newY >= 0 && newY < height) {
              particle.currentIndex = newY * width + newX;

              // Draw particle using its individual size
              for (
                let py = -Math.floor(particle.size / 2);
                py <= Math.floor(particle.size / 2);
                py++
              ) {
                for (
                  let px = -Math.floor(particle.size / 2);
                  px <= Math.floor(particle.size / 2);
                  px++
                ) {
                  const drawX = newX + px;
                  const drawY = newY + py;

                  if (
                    drawX >= 0 &&
                    drawX < width &&
                    drawY >= 0 &&
                    drawY < height
                  ) {
                    const drawIndex = drawY * width + drawX;
                    dst[drawIndex] = imageView[particle.startIndex];
                  }
                }
              }
            }

            particle.life--;
            particle.velocity.x *= 0.98; // Slow down
            particle.velocity.y *= 0.98;
          }
        });

        // Fill in remaining pixels gradually
        const fillRate = Math.floor(imageView.length / 60);
        for (let i = 0; i < fillRate; i++) {
          const randomIndex = Math.floor(Math.random() * imageView.length);
          dst[randomIndex] = imageView[randomIndex];
        }

        ctx.putImageData(imageData, 0, 0);

        if (frameCount < 90) {
          rafs.push(requestAnimationFrame(updateParticles));
        } else {
          finalizeTransition(onEnd);
        }
      }

      rafs.push(requestAnimationFrame(updateParticles));
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

          // initializeDestination();
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
