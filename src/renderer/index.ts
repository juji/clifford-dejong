import { Context2d } from './context2d';
import { ContextWebGL } from './contextWebGL'; // Import WebGL context
import { detectWebGL } from './detect-webgl'; // Import WebGL detection utility
import { type Options } from '@/state';

// Define a type that represents either context
type RenderingContext = Context2d | ContextWebGL;

export default class Renderer {
  canvas: HTMLCanvasElement;
  context: RenderingContext | null = null; // Use the union type
  // setImage: (img: string | null) => void | null; // Likely not needed for WebGL version

  constructor(
    canvas: HTMLCanvasElement,
    width: number,
    height: number,
    options: Options,
    setProgress: (num: number) => void,
    // setImage: (img: string | null) => void, // Remove setImage if not used by WebGL
    setFinish: () => void, // Add setFinish
    setStart: () => void   // Add setStart
  ) {
    this.canvas = canvas;
    this.canvas.width = width;
    this.canvas.height = height;
    // this.setImage = setImage;

    // Detect WebGL support
    const webglSupported = detectWebGL(canvas);
    console.log(`WebGL Supported: ${webglSupported}`);

    if (webglSupported) {
      try {
        this.context = new ContextWebGL(this.canvas, options, setProgress, setFinish, setStart);
      } catch (error) {
        console.error("Failed to initialize WebGL context:", error);
        // Fallback to 2D context if WebGL initialization fails
        console.log("Falling back to 2D Canvas renderer.");
        this.context = new Context2d(this.canvas, options, setProgress, setFinish, setStart);
      }
    } else {
      console.log("WebGL not supported, using 2D Canvas renderer.");
      this.context = new Context2d(this.canvas, options, setProgress, setFinish, setStart);
    }
  }

  onUpdate(options: Options) {
    this.context?.setOptions(options);
  }

  onPaused() {
    this.context?.pause();
  }

  onPlay() {
    // Both contexts now have a reset method that handles restarting
    this.context?.reset();
  }

  onResize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
    // Both contexts have an onResize method
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