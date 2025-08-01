import { TurboModule, TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  readonly reverseString: (
    input: string,
    onLog: (str: string) => void,
    onAfterReverse: (buffer: string) => void,
  ) => string;
  readonly setMainString: (input: string) => void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('NativeSampleModule');
