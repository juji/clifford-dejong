import NativeAttractorCalc from '@specs/NativeAttractorCalc';

export type AttractorCalcModuleParams = {
  timestamp: string;
};

export function calculateAttractorNative(
  params: AttractorCalcModuleParams,
): string {
  // This function will call the native module to calculate the attractor
  return NativeAttractorCalc.calculateAttractor(params.timestamp);
}
