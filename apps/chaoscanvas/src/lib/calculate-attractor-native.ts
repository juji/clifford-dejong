import { AttractorParameters } from '@repo/core/types';
import NativeAttractorCalc from '@specs/NativeAttractorCalc';
import { defaultState } from '@repo/state/attractor-store';

const defaultAttractorParameters: AttractorParameters =
  defaultState.attractorParameters;

export type AttractorCalcModuleParams = {
  timestamp: string;
  attractorParameters?: AttractorParameters;

  totalAttractorPoints?: number;
  // pointsPerIteration?: number;

  width?: number;
  height?: number;
  drawInterval?: number;
  progressInterval?: number;
  highQuality?: boolean;

  onProgress?: (
    progress: number,
    totalPointsWritten?: number,
    totalPointsTarget?: number,
  ) => void;
  onImageUpdate?: (done: boolean) => void;
};

export function calculateAttractorNative(params: AttractorCalcModuleParams) {
  const {
    timestamp,
    attractorParameters = defaultAttractorParameters,
    totalAttractorPoints = 20_000_000,
    // pointsPerIteration = 2_000_000,
    width = 1000,
    height = 1000,
    drawInterval = 100_000,
    progressInterval = 50_000,
    highQuality = true,
    onProgress,
    onImageUpdate,
  } = params;

  console.log('build number', NativeAttractorCalc.getBuildNumber());

  let pointsPerIteration = 100_000;
  // const performanceRating = NativeAttractorCalc.ratePerformance();
  // console.log('Performance rating:', performanceRating);
  // if(performanceRating === 0) {
  //   console.warn('Performance rating is UNKNOWN, using 100_000 (default) pointsPerIteration');
  // } else if(performanceRating <= 1) {
  //   console.warn('Performance rating is VERY_SLOW, using 500_000 pointsPerIteration');
  //   pointsPerIteration = 500_000; // VERY_SLOW
  // } else if(performanceRating <= 2) {
  //   console.warn('Performance rating is SLOW, using 1_000_000 pointsPerIteration');
  //   pointsPerIteration = 1_000_000; // SLOW
  // } else if(performanceRating <= 3) {
  //   console.warn('Performance rating is MEDIUM, using 2_000_000 pointsPerIteration');
  //   pointsPerIteration = 2_000_000; // MEDIUM
  // } else if(performanceRating <= 4) {
  //   console.log('Performance rating is MEDIUM or FAST, using 5_000_000 pointsPerIteration');
  //   pointsPerIteration = 5_000_000; // MEDIUM or FAST
  // } else {
  //   console.log('Performance rating is VERY_FAST, using 10_000_000 pointsPerIteration');
  //   pointsPerIteration = 10_000_000; // VERY_FAST
  // }

  const bufferSize = width * height * 4; // Assuming 4 bytes per pixel (RGBA)

  // Create the ArrayBuffer that will be written to by the C++ code.
  const sharedBuffer = new ArrayBuffer(bufferSize);
  const dataView = new Uint8Array(sharedBuffer);
  let prevSum = 0;

  // cancelation should be done locally, inside onProgress or onImageUpdate
  // this is because ios
  let cancelled = false;
  let cancelFunction: (() => void) | null = null;

  const now = new Date().getTime();

  const onProgressLocal = (
    progress: number,
    totalPointsWritten?: number,
    totalPointsTarget?: number,
  ) => {
    console.log(
      'Progress:',
      Math.round(progress * 100) + '%',
      'Total points written:',
      totalPointsWritten,
      'Total points target:',
      totalPointsTarget,
    );

    if (cancelled && cancelFunction) {
      console.log('Calculation cancelled, skipping progress update');
      cancelFunction();
      return;
    }

    onProgress && onProgress(progress, totalPointsWritten, totalPointsTarget);
  };

  const onImageUpdateLocal = (done: boolean) => {
    // The JS side can now access the updated `sharedBuffer` directly.
    // For example, create a view on the buffer to read the data.

    const currentSum = dataView.reduce((a, b) => a + b, 0);
    console.log('done:', done, 'image is the same:', currentSum === prevSum);

    if (prevSum === currentSum) {
      // set progress to 100%
      onProgressLocal && onProgressLocal(1);

      // run the cancel function
      if (cancelFunction) {
        console.log('Cancelling calculation due to no change in pixel data');
        cancelFunction();
      }

      console.log('No change in pixel data, skipping update');
      return;
    }

    if (cancelled && cancelFunction) {
      console.log('Calculation cancelled, skipping image update');
      cancelFunction();
      return;
    }

    prevSum = currentSum;

    onImageUpdate && onImageUpdate(done);

    if (done) {
      console.log('Calculation completed in', new Date().getTime() - now, 'ms');
    }
  };

  const { promise, cancel: cancelOnThread } =
    NativeAttractorCalc.calculateAttractor(
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

  cancelFunction = function () {
    cancelled = true;
    cancelOnThread();
  };

  // Cancelling after some time
  // this approach doesn't work on ios
  // setTimeout(() => {
  //   // If you want to cancel the calculation after some time, you can call cancel.
  //   console.log('Cancelling calculation after 500ms');
  //   console.log('actual elapsed time:', new Date().getTime() - now, 'ms');
  //   cancel();
  // }, 500);

  // Pass the sharedBuffer to the native function.
  return { promise, cancel: cancelFunction, dataView };
}
