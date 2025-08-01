// attractor-jsi.ts
// Minimal JS wrapper for native attractor JSI (callback-based)
// Usage: runAttractor(params, (imageData: ArrayBuffer) => { ... })
export function runAttractor(
  params: {
    attractor: string;
    a: number;
    b: number;
    c: number;
    d: number;
    scale: number;
    left: number;
    top: number;
    hue: number;
    saturation: number;
    brightness: number;
    background: number[];
    width: number;
    height: number;
    highQuality: boolean;
    totalPoints: number;
    pointsPerIteration: number;
  },
  onImageReady: (uint8Array: Uint8Array) => void,
): () => void {
  let cancelled = false;

  function onImageReadyLocal(imageData: ArrayBuffer) {
    if (cancelled) return;
    const uint8Array = new Uint8Array(imageData);
    onImageReady(uint8Array);
  }

  function shouldCancel() {
    return cancelled;
  }

  // @ts-ignore
  global.runAttractorCpp(params, onImageReadyLocal, shouldCancel);

  return () => {
    cancelled = true;
  };
}
