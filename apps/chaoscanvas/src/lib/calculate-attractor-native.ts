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
  timestamp?: string;
  attractorParameters?: AttractorParameters;

  totalAttractorPoints?: number;
  pointsPerIteration?: number;

  width?: number;
  height?: number;
  highQuality?: boolean;

  onProgress?: (
    totalProgress: number,
    totalPoints: number,
    totalAttractorPoints: number,
  ) => void;
  onImageUpdate?: () => void;

  log?: boolean;
};

export function getBuildNumber() {
  return NativeAttractorCalc.getBuildNumber();
}

const SCALE = 100;
export function calculateAttractorNative(params: AttractorCalcModuleParams) {
  let {
    timestamp = new Date().toISOString(),
    attractorParameters = defaultAttractorParameters,

    totalAttractorPoints = 20_000_000,
    pointsPerIteration = 2_000_000,

    width = 1000,
    height = 1000,

    highQuality = true,
    onProgress,
    onImageUpdate,

    log = true,
  } = params;

  totalAttractorPoints = 20_000_000;
  pointsPerIteration = 2_000_000;

  // Assuming 4 bytes per pixel (RGBA)
  // and 4 bytes of uint32

  const dataView = new Uint32Array(width * height); // RGBA format
  const densityView = new Uint32Array(width * height); // uint32 format

  // Initialize arrays with zeros
  dataView.fill(0);
  densityView.fill(0);

  // Create the ArrayBuffer that will be written to by the C++ code.
  const sharedDensityBuffer = densityView.buffer; // uint32
  const sharedImageBuffer = dataView.buffer; // uint8 rgba
  const imageView = new Uint8Array(dataView.buffer); // RGBA format

  console.log('Shared buffers created:', {
    width,
    height,
    sharedDensityBuffer: sharedDensityBuffer.byteLength,
    sharedImageBuffer: sharedImageBuffer.byteLength,
    dataView: dataView.byteLength,
  });

  // cancelation should be done locally
  let cancelled = false;
  let totalPoints = 0;
  let totalProgress = 0;
  let maxDensity = 0;
  let x = 0;
  let y = 0;

  function cancelFunction() {
    if (log) console.log('assigning cancel function');
    cancelled = true;
  }

  // something to measure the time it takes to run the calculation
  const now = new Date().getTime();

  const onProgressLocal = (pointsAdded: number) => {
    if (cancelled) {
      if (log) console.log('Calculation cancelled, skipping progress update');
      return;
    }

    totalPoints += pointsAdded;
    totalProgress = totalPoints / totalAttractorPoints;

    if (log)
      console.log(
        'Progress:',
        Math.round(totalProgress * 100) + '%',
        'Total points written:',
        totalPoints,
        'Total points target:',
        totalAttractorPoints,
      );

    onProgress && onProgress(totalProgress, totalPoints, totalAttractorPoints);
  };

  const onImageUpdateLocal = () => {
    // The JS side can now access the updated `sharedBuffer` directly.
    // For example, create a view on the buffer to read the data.

    // not stopping, even if the pixel data are the same
    // because in future update(s), pixel data might be updated

    if (cancelled) {
      if (log) console.log('Calculation cancelled, skipping image update');
      return;
    }

    onImageUpdate && onImageUpdate();
    if (log) console.log('image updated');
  };

  // create a promise chain for calling c++
  // this can be stopped by the cancel function
  let returnedPromise: Promise<string> = Promise.resolve('');
  let tp = 0;
  const updatedAttractorParameters = {
    ...attractorParameters,
    scale: attractorParameters.scale * SCALE,
  };
  while (tp < totalAttractorPoints) {
    returnedPromise = returnedPromise.then(async () => {
      // on canccellation
      if (cancelled) {
        throw new Error('');
      }

      const {
        timestamp: newTimestamp,
        x: newX,
        y: newY,
        maxDensity: newMaxDensity,
        pointsAdded,
      } = await NativeAttractorCalc.calculateAttractor(
        timestamp,
        sharedDensityBuffer,
        sharedImageBuffer, // Pass the buffer here
        highQuality,

        updatedAttractorParameters,
        width,
        height,
        x,
        y,
        maxDensity,

        pointsPerIteration,
      );

      x = newX;
      y = newY;
      maxDensity = newMaxDensity;

      onProgressLocal(pointsAdded);
      onImageUpdateLocal();

      return newTimestamp;
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
    imageView,
  };
}
