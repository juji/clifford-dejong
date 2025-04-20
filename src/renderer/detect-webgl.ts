/**
 * Checks if WebGL is supported and available in the current browser.
 * Optionally tries to get a context from a provided canvas.
 * @param canvas Optional canvas element to test context creation on.
 * @returns True if WebGL seems supported, false otherwise.
 */
export function detectWebGL(canvas?: HTMLCanvasElement): boolean {
  try {
    const testCanvas = canvas || document.createElement('canvas');
    // Try to get both webgl and experimental-webgl contexts
    const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
    return !!gl && gl instanceof WebGLRenderingContext;
  } catch (e) {
    return false;
  }
}