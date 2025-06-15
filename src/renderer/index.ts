import { Context2d } from './context2d';
import { ContextWebGL } from './contextWebGL'; // Import WebGL context
import { detectWebGL } from './detect-webgl'; // Import WebGL detection utility
import { type Options } from '@/state';

// Define a type that represents either context
type RenderingContext = Context2d | ContextWebGL;

export default class Renderer {
  canvas: HTMLCanvasElement;
  context: RenderingContext | null = null; // Use the union type
  private currentRenderMode: 'original' | 'modern'; // Store the current mode
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

    this.currentRenderMode = options.renderMode; // Store initial mode
    this._initializeContext(options); // Call private method to create context
  }

  // Private method to initialize the correct context based on options
  private _initializeContext(options: Options): void {
    // Clear previous context if exists (needed if we implement dynamic switching later)
    if (this.context && typeof (this.context as any).destroy === 'function') {
        (this.context as any).destroy();
        this.context = null;
    }

    if (options.renderMode === 'original') {
      console.log("Initializing 2D Canvas renderer (original mode).");
      this.context = new Context2d(this.canvas, options, this.setProgress, this.setFinish, this.setStart);
    } else { // renderMode === 'modern'
      const webglSupported = detectWebGL(this.canvas);
      console.log(`Modern mode selected. WebGL Supported: ${webglSupported}`);
      if (webglSupported) {
        try {
          console.log("Initializing WebGL renderer (modern mode).");
          this.context = new ContextWebGL(this.canvas, options, this.setProgress, this.setFinish, this.setStart);
        } catch (error) {
          console.error("Failed to initialize WebGL context:", error);
          console.log("Falling back to 2D Canvas renderer.");
          this.context = new Context2d(this.canvas, options, this.setProgress, this.setFinish, this.setStart);
        }
      } else {
        console.log("WebGL not supported, using 2D Canvas renderer even in modern mode.");
        this.context = new Context2d(this.canvas, options, this.setProgress, this.setFinish, this.setStart);
      }
    }
  }

  onUpdate(options: Options) {
    if (options.renderMode !== this.currentRenderMode) {
      console.warn(`Render mode changed from '${this.currentRenderMode}' to '${options.renderMode}'. Please reload the page for the change to take full effect.`);
      // Update the current mode, but don't dynamically switch contexts yet
      this.currentRenderMode = options.renderMode;
      // We still call setOptions in case the fallback 2D context needs the update
      // or if other non-mode options changed simultaneously.
      // Ideally, we'd re-initialize fully here, but that's more complex.
      this._initializeContext(options); // Attempt re-initialization
    } else {
      // Only call setOptions if the mode hasn't changed
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