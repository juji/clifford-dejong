import { AttractorParameters } from '@repo/core/types';
import NativeAttractorCalc from '@specs/NativeAttractorCalc';

const defaultAttractorParameters: AttractorParameters = {
  attractor: 'clifford',
  a: -1.8,
  b: -2.0,
  c: -0.5,
  d: 0.9,
  hue: 200,
  saturation: 100,
  brightness: 100,
  background: [0, 0, 0, 255],
  scale: 100,
  left: 0,
  top: 0,
};

export type AttractorCalcModuleParams = {
  timestamp: string;
  attractorParameters?: AttractorParameters;

  totalAttractorPoints?: number;
  pointsPerIteration?: number;

  width?: number;
  height?: number;
  drawOn?: number;
  highQuality?: boolean;

  onProgress?: (progress: number) => void;
  onImageUpdate?: (done: boolean) => void;
};

export function calculateAttractorNative({
  timestamp,
  attractorParameters = defaultAttractorParameters,
  totalAttractorPoints = 1_000_000,
  pointsPerIteration = 5000,
  width = 1000,
  height = 1000,
  drawOn = 5000,
  highQuality = true,
  onProgress,
  onImageUpdate,
}: AttractorCalcModuleParams) {
  const bufferSize = width * height * 4; // Assuming 4 bytes per pixel (RGBA)

  // Create the ArrayBuffer that will be written to by the C++ code.
  const sharedBuffer = new ArrayBuffer(bufferSize);
  const dataView = new Uint8Array(sharedBuffer);

  const onProgressLocal =
    onProgress ||
    ((progress: number) => {
      console.log('Progress:', Math.round(progress * 100) + '%');
    });

  const onImageUpdateLocal =
    onImageUpdate ||
    ((done: boolean) => {
      // The JS side can now access the updated `sharedBuffer` directly.
      // For example, create a view on the buffer to read the data.
      console.log(
        'done:',
        done,
        'First 10 points:',
        dataView.length > 0 ? dataView.slice(0, 10) : 'N/A',
      );
    });

  const { promise, cancel } = NativeAttractorCalc.calculateAttractor(
    timestamp,
    sharedBuffer, // Pass the buffer here
    attractorParameters,
    width,
    height,
    drawOn,
    highQuality,
    totalAttractorPoints,
    pointsPerIteration,
    onProgressLocal,
    onImageUpdateLocal,
  ) as { promise: Promise<string>; cancel: () => void };

  const now = new Date().getTime();
  setTimeout(() => {
    // If you want to cancel the calculation after some time, you can call cancel.
    console.log('Cancelling calculation after 500ms');
    console.log('actual elapsed time:', new Date().getTime() - now, 'ms');
    cancel();
  }, 500);

  // Pass the sharedBuffer to the native function.
  return { promise, cancel, dataView };
}
