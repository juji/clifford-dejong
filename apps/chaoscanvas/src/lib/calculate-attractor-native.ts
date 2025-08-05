import { AttractorParameters } from '@repo/core/types';
import NativeAttractorCalc from '@specs/NativeAttractorCalc';
import { defaultState } from '@repo/state/attractor-store';

const defaultAttractorParameters: AttractorParameters =
  defaultState.attractorParameters;

// const defaultAttractorParameters: AttractorParameters = {
//   attractor: 'clifford',
//   a: -1.8,
//   b: -2.0,
//   c: -0.5,
//   d: 0.9,
//   hue: 200,
//   saturation: 100,
//   brightness: 100,
//   background: [0, 0, 0, 255],
//   scale: 100,
//   left: 0,
//   top: 0,
// };

export type AttractorCalcModuleParams = {
  timestamp: string;
  attractorParameters?: AttractorParameters;

  totalAttractorPoints?: number;
  pointsPerIteration?: number;

  width?: number;
  height?: number;
  drawInterval?: number;
  progressInterval?: number;
  highQuality?: boolean;

  onProgress?: (
    progress: number,
    totalPointsWritten: number,
    totalPointsTarget: number,
  ) => void;
  onImageUpdate?: (done: boolean) => void;
};

export function calculateAttractorNative({
  timestamp,
  attractorParameters = defaultAttractorParameters,
  totalAttractorPoints = 20_000_000,
  pointsPerIteration = 1_000_000,
  width = 1000,
  height = 1000,
  drawInterval = 100_000,
  progressInterval = 50_000,
  highQuality = true,
  onProgress,
  onImageUpdate,
}: AttractorCalcModuleParams) {
  const bufferSize = width * height * 4; // Assuming 4 bytes per pixel (RGBA)

  // Create the ArrayBuffer that will be written to by the C++ code.
  const sharedBuffer = new ArrayBuffer(bufferSize);
  const dataView = new Uint8Array(sharedBuffer);
  let prevSum = 0;
  let cancelLocal: (() => void) | null = null;

  const now = new Date().getTime();

  const onProgressLocal =
    onProgress ||
    ((
      progress: number,
      totalPointsWritten: number,
      totalPointsTarget: number,
    ) => {
      console.log(
        'Progress:',
        Math.round(progress * 100) + '%',
        'Total points written:',
        totalPointsWritten,
        'Total points target:',
        totalPointsTarget,
      );
    });

  const onImageUpdateLocal =
    onImageUpdate ||
    ((done: boolean) => {
      // The JS side can now access the updated `sharedBuffer` directly.
      // For example, create a view on the buffer to read the data.

      const currentSum = dataView.reduce((a, b) => a + b, 0);

      if (prevSum === currentSum) {
        console.log('No change in pixel data, skipping update');
        if (cancelLocal) {
          console.log('Cancelling calculation due to no change in pixel data');
          cancelLocal();
          // cancelLocal = null;
        }
        return;
      }

      console.log('done:', done, 'image is the same:', currentSum === prevSum);

      prevSum = currentSum;

      if (done) {
        console.log(
          'Calculation completed in',
          new Date().getTime() - now,
          'ms',
        );
      }
    });

  const { promise, cancel } = NativeAttractorCalc.calculateAttractor(
    timestamp,
    sharedBuffer, // Pass the buffer here
    attractorParameters,
    width,
    height,
    drawInterval,
    progressInterval,
    highQuality,
    totalAttractorPoints,
    pointsPerIteration,
    onProgressLocal,
    onImageUpdateLocal,
  ) as { promise: Promise<string>; cancel: () => void };

  cancelLocal = cancel;

  // const nowD = new Date().getTime();
  setTimeout(() => {
    // If you want to cancel the calculation after some time, you can call cancel.
    console.log('Cancelling calculation after 500ms');
    console.log('actual elapsed time:', new Date().getTime() - now, 'ms');
    cancel();
  }, 500);

  // Pass the sharedBuffer to the native function.
  return { promise, cancel, dataView };
}
