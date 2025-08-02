import { TurboModule, TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  readonly calculateAttractor: (
    // timestamp: ISO string, used to identify the calculation
    timestamp: string,

    // dimension of image
    // this is used to calculate the number of pixels
    // and the size of the Uint8Array
    // width: number,
    // height: number,

    // progress: 0 - 1
    onProgress: (progress: number) => void,

    // uint8string: uint8array concatenated to string, using "," as separator
    // done: true if the calculation is done, false if it's still in progress
    onUpdate: (uint8string: string, done: boolean) => void,
  ) => Promise<string>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('NativeAttractorCalc');
