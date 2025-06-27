
export function detectWebGL() {
  // Create canvas element. The canvas is not added to the
  // document itself, so it is never displayed in the
  // browser window.
  const canvas = document.createElement("canvas");

  // Get WebGLRenderingContext from canvas element.
  const gl = canvas.getContext("webgl");
  const support = gl instanceof WebGLRenderingContext
  canvas.remove()

  // Report the result.
  return support
      // ? "Congratulations! Your browser supports WebGL."
      // : "Failed. Your browser or device may not support WebGL.";
}