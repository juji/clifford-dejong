import NativeAttractorCalc from '@specs/NativeAttractorCalc';

// Define a constant for the buffer size for clarity
const POINT_COUNT = 2048 * 2048;
// Assuming each point is represented by 4 int (r, g, b, a)
const BYTES_PER_POINT = 4 * 4;
const BUFFER_SIZE = POINT_COUNT * BYTES_PER_POINT;

export type AttractorCalcModuleParams = {
  timestamp: string;
  onProgress?: (progress: number) => void;
  // The onUpdate callback now receives the number of new bytes written
  onUpdate?: (bytesWritten: number, done: boolean) => void;
};

// export type AttractorCalcResult = {
//   promise: Promise<string>;
// };

export function calculateAttractorNative(
  params: AttractorCalcModuleParams,
): Promise<string> {
  // Create the ArrayBuffer that will be written to by the C++ code.
  const sharedBuffer = new ArrayBuffer(BUFFER_SIZE);
  const dataView = new Uint8Array(sharedBuffer);

  const onProgress =
    params.onProgress ||
    ((progress: number) => {
      console.log('Progress:', Math.round(progress * 100) + '%');
    });

  const onUpdate =
    params.onUpdate ||
    ((bytesWritten: number, done: boolean) => {
      // The JS side can now access the updated `sharedBuffer` directly.
      // For example, create a view on the buffer to read the data.
      console.log(
        'Update received, bytes written:',
        bytesWritten,
        'done:',
        done,
        'First 10 points:',
        dataView.length > 0 ? dataView.slice(0, 10) : 'N/A',
      );
    });

  const { promise, cancel } = NativeAttractorCalc.calculateAttractor(
    params.timestamp,
    sharedBuffer, // Pass the buffer here
    onProgress,
    onUpdate,
  ) as { promise: Promise<string>; cancel: () => void };

  const now = new Date().getTime();
  setTimeout(() => {
    // If you want to cancel the calculation after some time, you can call cancel.
    console.log('Cancelling calculation after 500ms');
    console.log('actual elapsed time:', new Date().getTime() - now, 'ms');
    cancel();
  }, 500);

  // Pass the sharedBuffer to the native function.
  return promise;
}
