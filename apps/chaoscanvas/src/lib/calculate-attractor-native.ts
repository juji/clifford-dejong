import NativeAttractorCalc from '@specs/NativeAttractorCalc';

export type AttractorCalcModuleParams = {
  timestamp: string;
  onProgress?: (progress: number) => void;
  onUpdate?: (uint8string: string, done: boolean) => void;
};

export function calculateAttractorNative(
  params: AttractorCalcModuleParams,
): Promise<string> {
  // This function will call the native module to calculate the attractor
  const onProgress =
    params.onProgress ||
    ((progress: number) => {
      console.log('Progress:', Math.round(progress * 100) + '%');
    });

  const onUpdate =
    params.onUpdate ||
    ((uint8string: string, done: boolean) => {
      console.log(
        'Update received, data length:',
        uint8string.split(',').length,
        'done:',
        done,
      );
    });

  return NativeAttractorCalc.calculateAttractor(
    params.timestamp,
    onProgress,
    onUpdate,
  );
}
