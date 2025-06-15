import { Context2d } from './context2d';
import { ContextWebGL } from './contextWebGL'; // Import WebGL context
import { detectWebGL } from './detect-webgl'; // Import WebGL detection utility
import { type Options } from '@/state';

// Define a type that represents either context
type RenderingContext = Context2d | ContextWebGL;

export default class Renderer {
  canvas: HTMLCanvasElement;
  context: RenderingContext | null = null; // Use the union type
  private currentRenderMethod: 'original2d' | 'points2d' | 'modernWebGL'; // Store the current method
  // Store callbacks for potential re-initialization (though we'll start with reload message)
  private setProgress: (num: number) => void;
  private setFinish: () => void;
  private setStart: () => void;

  constructor(
    canvas: HTMLCanvasElement,
    width: number,
    height: number,
    options: Options,
    setProgress: (num: number) => void,
    setFinish: () => void, 
    setStart: () => void   
  ) {
    this.canvas = canvas;
    this.canvas.width = width;
    this.canvas.height = height;
    // Store callbacks
    this.setProgress = setProgress;
    this.setFinish = setFinish;
    this.setStart = setStart;

    this.currentRenderMethod = options.renderMethod; // Store initial method
    this._initializeContext(options); // Call private method to create context
  }

  // Private method to initialize the correct context based on options
  private _initializeContext(options: Options): void {
    // Clear previous context if exists (needed if we implement dynamic switching later)
    if (this.context && typeof (this.context as any).destroy === 'function') {
        (this.context as any).destroy();
        this.context = null;
    }

    const method = options.renderMethod;

    if (method === 'original' || method === 'points2d') { // <-- Changed from original2d
      console.log(`Initializing 2D Canvas renderer (method: ${method}).`);
      this.context = new Context2d(this.canvas, options, this.setProgress, this.setFinish, this.setStart);
    } else { // method === 'modernWebGL'
      const webglSupported = detectWebGL(this.canvas);
      console.log(`ModernWebGL method selected. WebGL Supported: ${webglSupported}`);
      if (webglSupported) {
        try {
          console.log("Initializing WebGL renderer.");
          this.context = new ContextWebGL(this.canvas, options, this.setProgress, this.setFinish, this.setStart);
        } catch (error) {
          console.error("Failed to initialize WebGL context:", error);
          console.log("Falling back to 2D Canvas renderer (points2d).");
          // Fallback to points2d when WebGL fails
          const fallbackOptions = { ...options, renderMethod: 'points2d' as const };
          this.context = new Context2d(this.canvas, fallbackOptions, this.setProgress, this.setFinish, this.setStart);
        }
      } else {
        console.log("WebGL not supported, falling back to 2D Canvas renderer (points2d).");
        // Fallback to points2d when WebGL not supported
        const fallbackOptions = { ...options, renderMethod: 'points2d' as const };
        this.context = new Context2d(this.canvas, fallbackOptions, this.setProgress, this.setFinish, this.setStart);
      }
    }
  }

  onUpdate(options: Options) {
    if (options.renderMethod !== this.currentRenderMethod) {
      console.warn(`Render method changed from '${this.currentRenderMethod}' to '${options.renderMethod}'. Re-initializing context.`);
      this.currentRenderMethod = options.renderMethod;
      this._initializeContext(options); // Re-initialize with new options
    } else {
      // Only call setOptions if the method hasn't changed
      this.context?.setOptions(options);
    }
  }

  onPaused() {
    this.context?.pause();
  }

  onPlay() {
    // Contexts handle restarting internally now
    this.context?.play(); // Use play instead of reset if available
  }

  onResize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.context?.onResize();
  }

  // Add a destroy method to clean up resources
  destroy(): void {
    console.log('Destroying renderer...');
    // Add destroy method to contexts if they need cleanup (especially WebGL)
    if (this.context && typeof (this.context as any).destroy === 'function') {
        (this.context as any).destroy();
    }
    this.context = null;
  }
}