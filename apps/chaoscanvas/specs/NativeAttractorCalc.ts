import { TurboModule, TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  readonly calculateAttractor: (
    // timestamp: ISO string, used to identify the calculation
    timestamp: string,

    // The shared buffer for zero-copy data transfer
    buffer: Object,

    // progress: 0 - 1
    onProgress: (progress: number) => void,

    // bytesWritten: number of bytes written in the last update
    // done: true if the calculation is done
    onUpdate: (bytesWritten: number, done: boolean) => void,
  ) => Object;
}

export default TurboModuleRegistry.getEnforcing<Spec>('NativeAttractorCalc');
