import { TurboModule, TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  readonly getBuildNumber: () => string;
  readonly ratePerformance: () => number;
  readonly calculateAttractor: (
    // timestamp: ISO string, used to identify the calculation
    timestamp: string,

    // The shared buffers for zero-copy data transfer
    densityBuffer: Object,
    imageBuffer: Object,
    highQuality: boolean,

    attractorParameters: Object,
    width: number,
    height: number,
    x: number,
    y: number,
    maxDensity: number,

    // how many points to calculate
    pointsToCalculate: number,
  ) => Promise<{
    timestamp: string;
    x: number;
    y: number;
    maxDensity: number;
    pointsAdded: number;
  }>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('NativeAttractorCalc');
