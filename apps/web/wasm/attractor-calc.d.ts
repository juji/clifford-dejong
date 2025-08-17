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
  UNKNOWN = 0,
}

/**
 * Get the build number of the WASM module
 */
export function getBuildNumber(): string;

/**
 * Calculates points for the specified attractor and accumulates density
 *
 * @param attractorParams Parameters for the attractor
 * @param densityBuffer A TypedArray buffer to store point density information
 * @param infoBuffer A TypedArray buffer for storing info like maxDensity
 * @param width The width of the target image
 * @param height The height of the target image
 * @param x The initial x coordinate
 * @param y The initial y coordinate
 * @param pointsToCalculate The number of points to calculate
 * @returns An object containing the result of the calculation
 */
export function calculateAttractorDensity(
  attractorParams: AttractorParameters,
  densityBuffer: Uint32Array | Int32Array,
  infoBuffer: Uint32Array | Int32Array,
  width: number,
  height: number,
  x: number,
  y: number,
  pointsToCalculate: number,
): AttractorResult;

/**
 * Creates an attractor image from density data
 *
 * @param attractorParams Parameters for the attractor
 * @param densityBuffer A TypedArray buffer with point density information
 * @param imageBuffer A TypedArray buffer to store the generated image data
 * @param infoBuffer A TypedArray buffer with info like maxDensity
 * @param highQuality Whether to use high quality rendering
 * @param width The width of the target image
 * @param height The height of the target image
 * @param x The initial x coordinate
 * @param y The initial y coordinate
 * @param pointsToCalculate The number of points to calculate
 * @returns An object containing the result of the operation
 */
export function createAttractorImage(
  attractorParams: AttractorParameters,
  densityBuffer: Uint32Array | Int32Array,
  imageBuffer: Uint32Array | Int32Array,
  infoBuffer: Uint32Array | Int32Array,
  highQuality: boolean,
  width: number,
  height: number,
  x: number,
  y: number,
  pointsToCalculate: number,
): any;

/**
 * Calculates points for the specified attractor and updates image data
 *
 * @param attractorParams Parameters for the attractor
 * @param densityBuffer A TypedArray buffer to store point density information
 * @param imageBuffer A TypedArray buffer to store the generated image data
 * @param infoBuffer A TypedArray buffer with info like maxDensity
 * @param highQuality Whether to use high quality rendering
 * @param width The width of the target image
 * @param height The height of the target image
 * @param x The initial x coordinate
 * @param y The initial y coordinate
 * @param pointsToCalculate The number of points to calculate
 * @param shouldDraw Whether to draw the image data
 * @returns An object containing the result of the calculation
 */
export function calculateAttractor(
  attractorParams: AttractorParameters,
  densityBuffer: Uint32Array | Int32Array,
  imageBuffer: Uint32Array | Int32Array,
  infoBuffer: Uint32Array | Int32Array,
  highQuality: boolean,
  width: number,
  height: number,
  x: number,
  y: number,
  pointsToCalculate: number,
  shouldDraw: boolean,
): AttractorResult;

/**
 * Rates the performance of the system for attractor calculations
 * @returns A performance rating value
 */
export function ratePerformance(): PerformanceRating;
