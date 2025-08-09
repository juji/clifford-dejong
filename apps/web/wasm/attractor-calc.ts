// TypeScript wrapper for the attractor calculator WebAssembly module
// This provides proper type definitions and a nicer API for working with the module

// Define AttractorParameters interface locally to avoid import issues
export interface AttractorParameters {
  attractor: string;
  a: number;
  b: number;
  c: number;
  d: number;
  hue: number;
  saturation: number;
  brightness: number;
  background: number[];
  scale: number;
  left: number;
  top: number;
}

// Define the module interface
interface AttractorModule {
  AttractorCalculator: {
    new(): AttractorCalculator;
  };
  ratePerformance: () => number;
}

// Define the calculator interface
interface AttractorCalculator {
  getBuildNumber: () => string;
  calculateAttractor: (
    jsAttractorParams: AttractorParameters,
    jsDensityBuffer: Uint32Array | ArrayBuffer,
    jsImageBuffer: Uint32Array | ArrayBuffer,
    highQuality: boolean,
    width: number,
    height: number,
    x: number,
    y: number,
    maxDensity: number,
    pointsToCalculate: number
  ) => {
    maxDensity: number;
    x: number;
    y: number;
    pointsAdded: number;
    error?: string;
  };
}

// Enum for performance ratings
export enum PerformanceRating {
  VERY_SLOW = 1,
  SLOW = 2,
  MEDIUM = 3,
  FAST = 4,
  VERY_FAST = 5,
  UNKNOWN = 0
}

// Load the module
let modulePromise: Promise<AttractorModule> | null = null;
let calculator: AttractorCalculator | null = null;

export async function getAttractorCalculator(): Promise<AttractorCalculator> {
  if (calculator) {
    return calculator;
  }
  
  if (!modulePromise) {
    modulePromise = import('@/public/wasm/attractor-calc.mjs').then(
      (module) => module.default() as Promise<AttractorModule>
    );
  }
  
  const module = await modulePromise;
  calculator = new module.AttractorCalculator();
  return calculator;
}

export async function ratePerformance(): Promise<PerformanceRating> {
  if (!modulePromise) {
    modulePromise = import('@/public/wasm/attractor-calc.mjs').then(
      (module) => module.default() as Promise<AttractorModule>
    );
  }
  
  const module = await modulePromise;
  return module.ratePerformance() as PerformanceRating;
}
