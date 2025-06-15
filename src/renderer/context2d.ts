import { type Options } from '@/state'
import { hsv2rgb } from './hsv2rgb'
import { clifford, dejong } from './attractors'
import BezierEasing from 'bezier-easing'

// --- Constants ---
const DEFAULT_MAX_ITT = 200;
const LARGE_SCREEN_MAX_ITT = 1000;
const LARGE_SCREEN_THRESHOLD_WIDTH = 1920;
const INITIAL_PER_ITT = 100000; // Initial points calculated per frame
const DRAW_BITMAP_INTERVAL = 50; // Draw full bitmap every N iterations
const PERFORMANCE_THRESHOLD_MS = 100; // Adjust perItt if frame takes longer
const SMOOTHING_FACTOR = 0.2;
const PROGRESS_FACTOR_RUNNING = 98; // Progress percentage reported during animation
const PROGRESS_FACTOR_COMPLETE = 100; // Progress percentage reported on completion

// Bezier easing for color mapping
const saturationBezier = BezierEasing(.79,-0.34,.54,1.18);
const lightnesBezier = BezierEasing(.75,.38,.24,1.33);

// --- Helper Functions ---

/** Adds random jitter before scaling */
function smoothing(num: number, scale: number): number {
  const jitter = (Math.random() < 0.5 ? -SMOOTHING_FACTOR : SMOOTHING_FACTOR);
  return num + jitter / scale;
}

/** Calculates the color for a pixel based on density */
function getColorData(
  density: number,
  maxDensity: number,
  h: number,
  s: number,
  v: number // Brightness/Value
): number {
  if (density <= 0 || maxDensity <= 0) return 0; // Avoid log(0) or division by zero

  const mdens = Math.log(maxDensity);
  const pdens = Math.log(density);
  const densityRatio = mdens > 0 ? pdens / mdens : 0; // Avoid division by zero if maxDensity is 1

  const [ r, g, b ] = hsv2rgb(
    h,
    s - (saturationBezier(densityRatio) * s),
    (lightnesBezier(densityRatio) * v)
  );

  // Pack RGBA into a 32-bit integer (Alpha is always 255/opaque)
  return (255 << 24) | (b << 16) | (g << 8) | r;
}

// --- Main Class ---

export class Context2d {
  private context: CanvasRenderingContext2D | null = null;
  private options: Options;

  private width: number;
  private height: number;
  private centerX: number = 0;
  private centerY: number = 0;

  private animFrameId: number = 0;
  private scale: number = 150; // Base scale factor
  private currentScale: number = 150; // Effective scale including options.scale
  private itt: number = 0; // Current iteration
  private maxItt: number = DEFAULT_MAX_ITT; // Max iterations for the animation
  private perItt: number = INITIAL_PER_ITT; // Points calculated per frame (dynamic)
  private drawBitmapInterval: number = DRAW_BITMAP_INTERVAL; // How often to draw the full bitmap

  // Stores calculated points for the current frame's point drawing
  private currentFramePointsX: number[] = [];
  private currentFramePointsY: number[] = [];
  private lastX: number = 0; // Last calculated attractor point (logical coords)
  private lastY: number = 0;

  private paused: boolean = false;

  // Pixel density map (index = x + y * width)
  private pixels: number[];
  private maxDensity: number = 0; // Max density found in pixels array

  private attractorFn: ((x: number, y: number, a: number, b: number, c: number, d: number) => number[]) | null = null;
  private backgroundColorPacked: number = 0; // Pre-calculated background color

  // Callbacks
  private onProgress: ((n: number) => void) | null = null;
  private onFinish: (() => void) | null = null;
  private onStart: (() => void) | null = null;
  // private onImageReady: ((img: string) => void) | null = null; // Note: This callback is not used in the original code

  constructor(
    canvas: HTMLCanvasElement,
    options: Options,
    setProgress: (num: number) => void,
    setFinish?: () => void, // Optional callbacks
    setStart?: () => void
  ) {
    this.context = canvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D; // willReadFrequently for getImageData/putImageData performance

    // Add null check for the 2D context
    if (!this.context) {
        console.error("Failed to get 2D rendering context from canvas.");
        // Prevent further execution if context is null
        throw new Error("Could not initialize 2D context");
    }

    this.width = canvas.width;
    this.height = canvas.height;
    this.pixels = new Array(this.width * this.height).fill(0);
    this.options = options; // Initial options
    this.onProgress = setProgress;
    this.onFinish = setFinish || null;
    this.onStart = setStart || null;

    this._initializeState(); // Set initial state based on options
    this.start(); // Start the animation loop
  }

  /** Sets internal state based on current options and dimensions */
  private _initializeState(): void {
    // Determine max iterations based on screen size
    this.maxItt = this.width > LARGE_SCREEN_THRESHOLD_WIDTH ? LARGE_SCREEN_MAX_ITT : DEFAULT_MAX_ITT;

    // Reset iteration counters and state
    this.itt = 0;
    this.perItt = INITIAL_PER_ITT; // Reset dynamic points-per-iteration
    this.maxDensity = 0;
    this.lastX = 0;
    this.lastY = 0;
    this.pixels.fill(0); // Reset pixel density map

    // Select attractor function
    this.attractorFn = this.options.attractor === 'clifford' ? clifford : dejong;

    // Calculate scale and center based on options
    this.currentScale = this.scale * Math.max(0.001, this.options.scale);
    const centerXRatio = this.options.left;
    const centerYRatio = this.options.top;
    this.centerX = this.width / 2 + (centerXRatio * this.width);
    this.centerY = this.height / 2 + (centerYRatio * this.height);

    // Pre-calculate packed background color
    const [bgR, bgG, bgB] = this.options.background;
    this.backgroundColorPacked = (255 << 24) | (bgB << 16) | (bgG << 8) | bgR;

    // Reset canvas transform and clear
    this.context!.setTransform(1, 0, 0, 1, 0, 0);
    this.context!.clearRect(0, 0, this.width, this.height);
    // Apply new translation for centering
    this.context!.translate(this.centerX, this.centerY);
  }

  /** Reports progress via the callback */
  private reportProgress(n: number): void {
    this.onProgress && this.onProgress(n);
  }

  /** Updates options and resets the simulation */
  setOptions(options: Options): void {
    this.options = options;
    this.reset();
  }

  /** Resets the simulation state and restarts the animation */
  reset(): void {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    this.animFrameId = 0;
    this._initializeState();
    this.reportProgress(0);
    this.onStart && this.onStart();
    this.start();
  }

  /** Handles canvas resize events */
  onResize(): void {
    // Update dimensions from canvas
    this.width = this.context!.canvas.width;
    this.height = this.context!.canvas.height;
    // Re-allocate pixel buffer for new size
    this.pixels = new Array(this.width * this.height).fill(0);
    // Reset and restart simulation with new dimensions
    this.reset();
  }

  /** Draws the complete attractor based on the pixel density map */
  private drawBitmap(finalRender: boolean = false): void {
    const imageData = this.context!.createImageData(this.width, this.height);
    // Use ArrayBuffer and typed arrays for performance
    const buf = new ArrayBuffer(imageData.data.length);
    const buf8 = new Uint8ClampedArray(buf); // Clamped byte view
    const data32 = new Uint32Array(buf);     // 32-bit integer view (for packing RGBA)

    const numPixels = this.width * this.height;
    const bgColor = finalRender ? this.backgroundColorPacked : 0; // Use transparent background for intermediate renders

    const { hue, saturation, brightness } = this.options;

    for (let i = 0; i < numPixels; i++) {
      const density = this.pixels[i];
      data32[i] = density > 0
        ? getColorData(density, this.maxDensity, hue, saturation, brightness)
        : bgColor;
    }

    imageData.data.set(buf8); // Copy data back to ImageData
    // Draw the bitmap relative to the canvas origin (ignoring translation)
    this.context!.save();
    this.context!.setTransform(1, 0, 0, 1, 0, 0); // Reset transform for putImageData
    this.context!.putImageData(imageData, 0, 0);
    this.context!.restore(); // Restore translation
  }

  /** Main animation loop */
  private start(): void {
    // Stop if paused and past the initial few frames needed for preview
    if (this.paused && this.itt >= 20) return;

    // Check for completion
    if (this.itt >= this.maxItt) {
      this.drawBitmap(true); // Draw final bitmap with background
      this.onFinish && this.onFinish();
      this.reportProgress(PROGRESS_FACTOR_COMPLETE); // Report 100%
      this.animFrameId = 0; // Ensure loop stops
      return;
    }

    const frameStartTime = performance.now(); // Use performance.now() for higher precision timing
    let needsBitmapDraw = false;

    // --- Calculate Batch ---
    this.currentFramePointsX = []; // Clear points from previous frame
    this.currentFramePointsY = [];
    const pointsToCalculate = this.paused ? 5000 : this.perItt; // Calculate fewer points when paused
    for (let n = 0; n < pointsToCalculate; n++) {
      this.calculateSinglePoint();
    }

    // --- Draw ---
    // Decide whether to draw the full bitmap (less frequent) or just new points
    // --- MODIFIED LOGIC based on renderMethod ---
    if (this.options.renderMethod === 'direct2d') { // <-- Changed from points2d
        // Always draw points if method is 'direct2d'
        this.drawPoints();
        needsBitmapDraw = false; // Ensure performance adjustment logic doesn't skip
    } else { // Default to 'original' strategy (bitmap accumulation)
        if (!this.paused && (this.itt % this.drawBitmapInterval === 0)) {
            this.drawBitmap(false); // Draw intermediate bitmap (transparent background)
            needsBitmapDraw = true;
        } else {
            // Draw only the points calculated in this frame
            this.drawPoints();
            needsBitmapDraw = false; // Ensure performance adjustment logic doesn't skip
        }
    }
    // --- END MODIFIED LOGIC ---

    // --- Update State and Loop ---
    this.itt++;

    // Dynamically adjust points per iteration based on performance
    // --- MODIFIED CONDITION based on renderMethod ---
    // Only adjust if we didn't do a full bitmap draw OR if we are in 'direct2d' mode
    if (!this.paused && (!needsBitmapDraw || this.options.renderMethod === 'direct2d')) { // <-- Changed from points2d
    // --- END MODIFIED CONDITION ---
      const frameEndTime = performance.now();
      const frameDuration = frameEndTime - frameStartTime;

      // If frame took too long, reduce points calculated next time
      if (frameDuration > PERFORMANCE_THRESHOLD_MS && this.perItt > 1000) { // Add a lower bound
        this.perItt = Math.max(1000, Math.floor(this.perItt / 1.5)); // Reduce more gradually
      }
      // Optional: Increase perItt if frames are very fast (e.g., < 10ms)
      // else if (frameDuration < 10 && this.perItt < 1000000) {
      //   this.perItt = Math.min(1000000, Math.floor(this.perItt * 1.2));
      // }
    }

    // Request next frame
    this.animFrameId = requestAnimationFrame(() => {
      // Report progress (using 98% factor to leave room for the final 100%)
      this.reportProgress(PROGRESS_FACTOR_RUNNING * this.itt / this.maxItt);
      this.start(); // Continue the loop
    });
  }

  /** Calculates a single attractor point and updates pixel density */
  private calculateSinglePoint(): void {
    if (!this.attractorFn) return; // Should not happen after initialization

    const { a, b, c, d } = this.options;

    // Calculate next logical coordinates using the selected attractor function
    const [nextX, nextY] = this.attractorFn(this.lastX, this.lastY, a, b, c, d);

    // Apply smoothing
    const smoothedX = smoothing(nextX, this.currentScale);
    const smoothedY = smoothing(nextY, this.currentScale);

    // Scale to screen coordinates (relative to center)
    const screenX = Math.round(smoothedX * this.currentScale);
    const screenY = Math.round(smoothedY * this.currentScale);

    // Calculate the index in the flat pixel array (absolute coords)
    // Need to add centerX/Y to convert from center-relative to top-left-relative coords
    const pixelIndexX = Math.floor(screenX + this.centerX);
    const pixelIndexY = Math.floor(screenY + this.centerY);

    // Check if the point is within the canvas bounds
    if (
      pixelIndexX >= 0 && pixelIndexX < this.width &&
      pixelIndexY >= 0 && pixelIndexY < this.height
    ) {
      const index = pixelIndexX + (pixelIndexY * this.width);
      if (index < this.pixels.length) { // Ensure index is valid (redundant check?)
        this.pixels[index]++;
        // Update max density if this pixel is now the densest
        if (this.maxDensity < this.pixels[index]) {
          this.maxDensity = this.pixels[index];
        }
      }
    }

    // Store the logical coordinates for the next iteration
    this.lastX = smoothedX;
    this.lastY = smoothedY;

    // Store screen coordinates for potential point drawing in this frame
    this.currentFramePointsX.push(screenX);
    this.currentFramePointsY.push(screenY);
  }

  /** Draws the points calculated in the current frame */
  private drawPoints(): void {
    const ctx = this.context!;
    const numPoints = this.currentFramePointsX.length;

    // Set fill style (low opacity for accumulation effect, unless paused)
    ctx.fillStyle = `hsla(${this.options.hue}, ${this.options.saturation}%, ${this.options.brightness / 3}%, ${this.paused ? '1' : '0.1'})`;

    // Use beginPath/fill outside the loop for potential performance gain
    ctx.beginPath();
    for (let n = 0; n < numPoints; n++) {
      // Draw a 1x1 rectangle for each point
      // Note: rect() adds to the current path, it doesn't draw immediately
      ctx.rect(this.currentFramePointsX[n], this.currentFramePointsY[n], 1, 1);
    }
    ctx.fill(); // Draw all rectangles added to the path
  }

  // Public methods for controlling playback
  pause(): void {
    this.paused = true;
  }

  play(): void {
    if (this.paused) {
      this.paused = false;
      // If the animation wasn't finished, restart the loop
      if (this.itt < this.maxItt && this.animFrameId === 0) {
         this.start();
      }
    }
  }
}