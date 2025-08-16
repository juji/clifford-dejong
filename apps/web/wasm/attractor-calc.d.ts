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

export interface AttractorResult {
  maxDensity: number;
  x: number;
  y: number;
  pointsAdded: number;
}

export enum PerformanceRating {
  VERY_SLOW = 1,
  SLOW = 2,
  MEDIUM = 3,
  FAST = 4,
  VERY_FAST = 5,
  UNKNOWN = 0
}

export class AttractorCalculator {
  /**
   * Constructs a new AttractorCalculator instance
   */
  constructor();

  /**
   * Get the build number of the WASM module
   */
  getBuildNumber(): string;

  /**
   * Calculates points for the specified attractor and updates image data
   * 
   * @param attractorParams Parameters for the attractor
   * @param densityBuffer A TypedArray buffer to store point density information
   * @param imageBuffer A TypedArray buffer to store the generated image data
   * @param highQuality Whether to use high quality rendering
   * @param width The width of the target image
   * @param height The height of the target image
   * @param x The initial x coordinate
   * @param y The initial y coordinate
   * @param maxDensity The maximum density value
   * @param pointsToCalculate The number of points to calculate
   * @returns An object containing the result of the calculation
   */
  calculateAttractor(
    attractorParams: AttractorParameters,
    densityBuffer: Uint32Array | Int32Array,
    imageBuffer: Uint32Array | Int32Array,
    highQuality: boolean,
    width: number,
    height: number,
    x: number,
    y: number,
    maxDensity: number,
    pointsToCalculate: number
  ): AttractorResult;
}

/**
 * Rates the performance of the system for attractor calculations
 * @returns A performance rating value
 */
export function ratePerformance(): PerformanceRating;
