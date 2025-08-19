// Web Worker for Attractor Draw

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
        self.postMessage({ type: "initialized" });
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
      // first, remove all rafs
      rafs.forEach((raf) => cancelAnimationFrame(raf));
      rafs = [];
      performAttractorDraw(data);
      break;

    case "terminate":
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
    function finalizeTransition() {
      if (expectedFinalPasses !== finalPassCount) return;
      console.log("finalizeTransition executed with random block sizes");

      const numSteps = 7;
      const stepDuration = 7; // Frames for glitch, then 5 for correction

      // Generate random blocks
      const blocks = [];
      for (let y = 0; y < height; ) {
        const blockH = Math.floor(Math.random() * 200) + 30;
        for (let x = 0; x < width; ) {
          const blockW = Math.floor(Math.random() * 100) + 200;
          blocks.push({ x, y, width: blockW, height: blockH });
          x += blockW;
        }
        y += blockH;
      }

      // Shuffle blocks
      for (let i = blocks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [blocks[i], blocks[j]] = [blocks[j], blocks[i]];
      }

      const revealedBlocks = new Set();
      let frame = 0;
      let currentStep = 0;

      const animate = () => {
        if (currentStep >= numSteps) {
          dst.set(imageView);
          ctx.putImageData(imageData, 0, 0);
          self.postMessage({ type: "done", highQuality: true });
          return;
        }

        const isGlitchPhase = frame % (stepDuration * 2) < stepDuration;

        if (isGlitchPhase && frame % stepDuration === 0) {
          // START OF A NEW GLITCH STEP
          const blocksPerStep = Math.ceil(blocks.length / numSteps);
          const stepStart = currentStep * blocksPerStep;
          const stepEnd = Math.min(stepStart + blocksPerStep, blocks.length);

          for (let i = stepStart; i < stepEnd; i++) {
            const block = blocks[i];
            if (!block) continue;
            revealedBlocks.add(block);

            // Apply a random glitch
            if (Math.random() < 0.5) {
              // Displacement
              const offsetX = Math.floor((Math.random() - 0.5) * 150);
              const offsetY = Math.floor((Math.random() - 0.5) * 150);
              drawBlock(dst, imageView, block, { offsetX, offsetY });
            } else {
              // Skew
              const skew = (Math.random() - 0.5) * 0.5;
              drawBlock(dst, imageView, block, { skew });
            }
          }
        } else if (!isGlitchPhase && frame % stepDuration === 0) {
          // CORRECTION PHASE
          revealedBlocks.forEach((block) => {
            drawBlock(dst, imageView, block, {}); // No glitch
          });
          currentStep++;
        }

        ctx.putImageData(imageData, 0, 0);
        frame++;
        rafs.push(requestAnimationFrame(animate));
      };

      const drawBlock = (
        buffer,
        source,
        block,
        { offsetX = 0, offsetY = 0, skew = 0 },
      ) => {
        const { x, y, width: blockW, height: blockH } = block;
        for (let j = 0; j < blockH; j++) {
          const skewOffset = skew ? Math.floor(skew * j) : 0;
          for (let i = 0; i < blockW; i++) {
            const fromX = x + i;
            const fromY = y + j;
            const toX = fromX + offsetX + skewOffset;
            const toY = fromY + offsetY;

            if (
              fromX >= 0 &&
              fromX < width &&
              fromY >= 0 &&
              fromY < height &&
              toX >= 0 &&
              toX < width &&
              toY >= 0 &&
              toY < height
            ) {
              const fromIndex = fromY * width + fromX;
              const toIndex = toY * width + toX;
              buffer[toIndex] = source[fromIndex];
            }
          }
        }
      };

      rafs.forEach((raf) => cancelAnimationFrame(raf));
      rafs = [];
      rafs.push(requestAnimationFrame(animate));
    }

    // Replace the transition buffer section with this:

    const maxParticle = 120000;
    let numParticlesCreated = 0;
    let keepAnimating = true;
    function transitionToNewImage(onEnd) {
      if (numParticlesCreated >= maxParticle) {
        return;
      }

      const numParticles = 30000; // Reduced for better performance
      numParticlesCreated += numParticles;

      const particles = [];
      expectedFinalPasses++;

      // Create particles from colored pixels with more attempts to ensure we get enough
      let attempts = numParticles * 3; // Try more indices to ensure enough colored particles
      let particlesCreated = 0;

      for (let i = 0; i < attempts && particlesCreated < numParticles; i++) {
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
            // These are kept but no longer used for animation termination
            maxLife: 60,
            life: 60,
            size: Math.floor(Math.random() * 2) + 1, // Random size from 1 to 2
          });

          particlesCreated++;
        }
      }

      console.log(
        `Created ${particles.length} particles for indefinite animation`,
      );

      let frameCount = 0;

      function updateParticles() {
        frameCount++;
        let totalVel = 0;
        let totalVelDenom = 0;
        particles.forEach((particle) => {
          // Always keep particles active, removing life check
          {
            // Spring physics - calculate acceleration towards original position
            const springStrength = 0.01; // How strong the spring force is
            let damping = 0.99; // Velocity damping to reduce oscillation

            // Calculate distance from original position
            let deltaX = particle.originalX - particle.x;
            let deltaY = particle.originalY - particle.y;

            // add to delta, to preevnt speed decrease
            if (
              Math.abs(particle.velocityX) < 1 &&
              Math.abs(particle.velocityY) < 1 &&
              keepAnimating
            ) {
              deltaX *= Math.random() * 3 + 5;
              deltaY *= Math.random() * 3 + 5;
            }

            // Apply spring force (acceleration towards original position)
            const accelerationX = deltaX * springStrength;
            const accelerationY = deltaY * springStrength;

            // Add some random noise for more dynamic movement
            // const randomForce = 0.7; // Adjust this value to control the amount of randomness
            // particle.velocityX += (Math.random() - 0.5) * randomForce;
            // particle.velocityY += (Math.random() - 0.5) * randomForce;

            // Update velocity with acceleration
            particle.velocityX += accelerationX;
            particle.velocityY += accelerationY;

            // Apply damping to velocity
            particle.velocityX *= damping;
            particle.velocityY *= damping;

            totalVel +=
              Math.abs(particle.velocityX) + Math.abs(particle.velocityY);
            totalVelDenom += 2;

            // Update position with velocity
            particle.x += particle.velocityX;
            particle.y += particle.velocityY;

            // Keep particles within bounds
            particle.x = Math.max(0, Math.min(width - 1, particle.x));
            particle.y = Math.max(0, Math.min(height - 1, particle.y));

            // Always maintain full visibility instead of fading out
            // Get original color components
            const originalColor = imageView[particle.startIndex];
            const r = originalColor & 0xff;
            const g = (originalColor >> 8) & 0xff;
            const b = (originalColor >> 16) & 0xff;
            const a = (originalColor >> 24) & 0xff;

            // Use full alpha (no fade)
            const fadedColor = (a << 24) | (b << 16) | (g << 8) | r;

            // Draw particle using its individual size with faded color
            let pixelIndex = 0;
            const particlePixelCount = particle.size * particle.size;

            while (pixelIndex < particlePixelCount) {
              const px =
                (pixelIndex % particle.size) - Math.floor(particle.size / 2);
              const py =
                Math.floor(pixelIndex / particle.size) -
                Math.floor(particle.size / 2);

              const drawX = Math.floor(particle.x) + px;
              const drawY = Math.floor(particle.y) + py;

              if (drawX >= 0 && drawX < width && drawY >= 0 && drawY < height) {
                const drawIndex = drawY * width + drawX;
                dst[drawIndex] = fadedColor;
              }

              pixelIndex++;
            }

            // Remove the life decrement to keep particles alive indefinitely
            // particle.life--;
          }
        });

        ctx.putImageData(imageData, 0, 0);

        const velAvg = totalVelDenom ? totalVel / totalVelDenom : Infinity;
        if (velAvg < 0.5) {
          finalPassCount++;
          finalizeTransition(onEnd);
        } else {
          rafs.push(requestAnimationFrame(updateParticles));
        }
      }

      rafs.push(requestAnimationFrame(updateParticles));
    }

    function drawSimpleImage() {
      dst.set(imageView);
      ctx.putImageData(imageData, 0, 0);
    }

    requestAnimationFrame(function run() {
      if (info[3] === progress) {
        return requestAnimationFrame(run);
      }

      progress = info[3];
      self.postMessage({ type: "progress", progress });

      if (highQuality) {
        // Always recreate animation on progress updates
        if (progress === 100) keepAnimating = false;
        transitionToNewImage(() => {
          console.log("Sending Done message");
          self.postMessage({ type: "done", highQuality: true });
        });
      } else {
        drawSimpleImage();
      }

      if (progress === 100) {
        console.log("draw done in", performance.now() - start, "ms");

        if (!highQuality) {
          self.postMessage({ type: "done", highQuality: false });
        }
      } else {
        requestAnimationFrame(run);
      }
    });
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
