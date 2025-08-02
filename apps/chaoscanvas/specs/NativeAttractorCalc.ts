import { TurboModule, TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  readonly calculateAttractor: (timestamp: string) => string;
}

export default TurboModuleRegistry.getEnforcing<Spec>('NativeAttractorCalc');
