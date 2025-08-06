import { AttractorParameters } from '@repo/core/types';
import NativeAttractorCalc from '@specs/NativeAttractorCalc';
import { defaultState } from '@repo/state/attractor-store';

const defaultAttractorParameters: AttractorParameters =
  defaultState.attractorParameters;

export function ratePerformance(log = true) {
  // pointsPerIteration is the number of points calculated per iteration
  // this is used to determine the performance rating of the device
  // and to set the number of points calculated per iteration

  // pointsPerIteration needs to a be a denominator that returns a whole number
  // when used in totalAttractorPoints / pointsPerIteration

  let pointsPerIteration = 100_000;
  const performanceRating = NativeAttractorCalc.ratePerformance();
  if (log) console.log('Performance rating:', performanceRating);
  if (performanceRating === 0) {
    if (log)
      console.warn(
        'Performance rating is UNKNOWN, using 100_000 (default) pointsPerIteration',
      );
  } else if (performanceRating <= 1) {
    if (log)
      console.warn(
        'Performance rating is VERY_SLOW, using 500_000 pointsPerIteration',
      );
    pointsPerIteration = 500_000; // VERY_SLOW
  } else if (performanceRating <= 2) {
    if (log)
      console.warn(
        'Performance rating is SLOW, using 1_000_000 pointsPerIteration',
      );
    pointsPerIteration = 1_000_000; // SLOW
  } else if (performanceRating <= 3) {
    if (log)
      console.warn(
        'Performance rating is MEDIUM, using 2_000_000 pointsPerIteration',
      );
    pointsPerIteration = 2_000_000; // MEDIUM
  } else if (performanceRating <= 4) {
    if (log)
      console.log(
        'Performance rating is FAST, using 5_000_000 pointsPerIteration',
      );
    pointsPerIteration = 5_000_000; // FAST
  } else {
    if (log)
      console.log(
        'Performance rating is VERY_FAST, using 10_000_000 pointsPerIteration',
      );
    pointsPerIteration = 10_000_000; // VERY_FAST
  }

  return { pointsPerIteration };
}

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
    totalPointsWritten?: number,
    totalPointsTarget?: number,
  ) => void;
  onImageUpdate?: (done: boolean) => void;

  log?: boolean;
};

export function logBuildNumber() {
  console.log('build number', NativeAttractorCalc.getBuildNumber());
}

export function calculateAttractorNative(params: AttractorCalcModuleParams) {
  const {
    timestamp,
    attractorParameters = defaultAttractorParameters,

    totalAttractorPoints = 20_000_000,
    pointsPerIteration = 2_000_000,

    width = 1000,
    height = 1000,
    drawInterval = 100_000,
    progressInterval = 50_000,

    highQuality = true,
    onProgress,
    onImageUpdate,

    log = true,
  } = params;

  // Assuming 4 bytes per pixel (RGBA)
  // and 4 bytes of uint32
  const bufferSize = width * height * 4;

  // Create the ArrayBuffer that will be written to by the C++ code.
  const sharedDensityBuffer = new ArrayBuffer(bufferSize); // uint32
  const sharedImageBuffer = new ArrayBuffer(bufferSize); // uint8 rgba
  const dataView = new Uint8Array(sharedImageBuffer);

  // cancelation should be done locally
  let cancelled = false;
  let totalPoints = 0;
  let totalProgress = 0;

  function cancelFunction() {
    if (log) console.log('assigning cancel function');
    cancelled = true;
  }

  // something to measure the time it takes to run the calculation
  const now = new Date().getTime();

  const onProgressLocal = (
    // progress: number,
    // will always be 100%
    _: number,
    totalPointsWritten?: number,
    // totalPointsTarget?: number,
  ) => {
    if (totalPointsWritten) {
      totalPoints += totalPointsWritten;
      totalProgress = totalPoints / totalAttractorPoints;
    }

    if (log)
      console.log(
        'Progress:',
        Math.round(totalProgress * 100) + '%',
        'Total points written:',
        totalPoints,
        'Total points target:',
        totalAttractorPoints,
      );

    if (cancelled) {
      if (log) console.log('Calculation cancelled, skipping progress update');
      return;
    }

    onProgress && onProgress(totalProgress, totalPoints, totalAttractorPoints);
  };

  const onImageUpdateLocal = (done: boolean) => {
    // The JS side can now access the updated `sharedBuffer` directly.
    // For example, create a view on the buffer to read the data.

    // not stopping, even if the pixel data are the same
    // because in future update(s), pixel data might be updated

    if (cancelled) {
      if (log) console.log('Calculation cancelled, skipping image update');
      return;
    }

    onImageUpdate && onImageUpdate(done);

    if (done) {
      if (log)
        console.log(
          'Calculation completed in',
          new Date().getTime() - now,
          'ms',
        );
    }
  };

  // create a promise chain for calling c++
  // this can be stopped by the cancel function
  let returnedPromise: Promise<string> = Promise.resolve('');
  let tp = 0;
  while (tp < totalAttractorPoints) {
    returnedPromise = returnedPromise.then(async () => {
      // on canccellation
      if (cancelled) {
        throw new Error('');
      }

      const {
        promise,
        // this is saying, we don't need the cancel function
        // just make sure this doesn't need to run very long
        // we do that by setting totalAttractorPoints to pointsPerIteration
        // cancel: cancelOnThread
      } = NativeAttractorCalc.calculateAttractor(
        timestamp,
        sharedDensityBuffer,
        sharedImageBuffer, // Pass the buffer here
        attractorParameters,
        width,
        height,
        drawInterval,
        progressInterval,
        highQuality,
        pointsPerIteration,
        onProgressLocal,
        onImageUpdateLocal,
      ) as { promise: Promise<string>; cancel: () => void };

      return promise;
    });

    tp += pointsPerIteration;
  }

  if (log) {
    returnedPromise = returnedPromise.then(ts => {
      console.log(
        'Attractor calculation completed in',
        new Date().getTime() - now,
        'ms',
      );
      return ts;
    });
  }

  // Pass the dataView to the native function.
  return {
    promise: returnedPromise,
    cancel: cancelFunction,
    dataView,
  };
}
