import { TurboModule, TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  readonly calculateAttractor: (timestamp: string) => Promise<string>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('NativeAttractorCalc');
