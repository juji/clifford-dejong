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

    // function initializeDestination() {
    //   // fill with background
    //   for (let j = 0; j < imageView.length; j++) {
    //     dst[j] = bg;
    //   }
    //   ctx.putImageData(imageData, 0, 0);
    // }

    // Add tracking for final passes
    let finalPassCount = 0;
    let expectedFinalPasses = 0;
    let onEndTimeout = null;
    function finalizeTransition(onEnd) {
      // Final cleanup - ensure everything is perfect
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
      const numParticles = 30000;
      expectedFinalPasses++;

      // Create particles from colored pixels
      for (let i = 0; i < numParticles; i++) {
        const randomIndex = Math.floor(Math.random() * imageView.length);
        if (imageView[randomIndex] !== bg) {
          const originalX = randomIndex % width;
          const originalY = Math.floor(randomIndex / width);

          particles.push({
            startIndex: randomIndex,
            originalX: originalX,
            originalY: originalY,
            x: originalX, // Current position
            y: originalY,
            velocityX: (Math.random() - 0.5) * 15, // Initial velocity
            velocityY: (Math.random() - 0.5) * 15,
            maxLife: Math.random() * 60 + 30, // Total lifespan
            life: Math.random() * 60 + 30, // Current life (30-90 frames)
            size: Math.floor(Math.random() * 2) + 1, // Random size from 1 to 2
          });
        }
      }

      let frameCount = 0;

      function updateParticles() {
        frameCount++;

        particles.forEach((particle) => {
          if (particle.life > 0) {
            // Spring physics - calculate acceleration towards original position
            const springStrength = 0.01; // How strong the spring force is
            const damping = 0.88; // Velocity damping to reduce oscillation

            // Calculate distance from original position
            const deltaX = particle.originalX - particle.x;
            const deltaY = particle.originalY - particle.y;

            // Apply spring force (acceleration towards original position)
            const accelerationX = deltaX * springStrength;
            const accelerationY = deltaY * springStrength;

            // Update velocity with acceleration
            particle.velocityX += accelerationX;
            particle.velocityY += accelerationY;

            // Apply damping to velocity
            particle.velocityX *= damping;
            particle.velocityY *= damping;

            // Update position with velocity
            particle.x += particle.velocityX;
            particle.y += particle.velocityY;

            // Keep particles within bounds
            particle.x = Math.max(0, Math.min(width - 1, particle.x));
            particle.y = Math.max(0, Math.min(height - 1, particle.y));

            // Calculate alpha (0 → 1)
            const alpha = 1 - particle.life / particle.maxLife; // 0 to 1 as particle ages

            // Get original color components
            const originalColor = imageView[particle.startIndex];
            const r = originalColor & 0xff;
            const g = (originalColor >> 8) & 0xff;
            const b = (originalColor >> 16) & 0xff;
            const a = (originalColor >> 24) & 0xff;

            // Apply parabolic fade
            const fadedAlpha = Math.floor(a * alpha);
            const fadedColor = (fadedAlpha << 24) | (b << 16) | (g << 8) | r;

            // Draw particle using its individual size with faded color
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
                const drawX = Math.floor(particle.x) + px;
                const drawY = Math.floor(particle.y) + py;

                if (
                  drawX >= 0 &&
                  drawX < width &&
                  drawY >= 0 &&
                  drawY < height
                ) {
                  const drawIndex = drawY * width + drawX;

                  // Only draw if the faded particle is visible enough
                  // if (fadedAlpha > 10) {
                  //   dst[drawIndex] = fadedColor;
                  // }

                  dst[drawIndex] = fadedColor;
                }
              }
            }

            particle.life--;
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
