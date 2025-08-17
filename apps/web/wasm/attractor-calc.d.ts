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
 * @param densityBuffer SharedArrayBuffer to store point density information (accessed as Uint32Array)
 * @param infoBuffer SharedArrayBuffer for storing info like maxDensity (accessed as Uint32Array)
 * @param width The width of the target image
 * @param height The height of the target image
 * @param x The initial x coordinate
 * @param y The initial y coordinate
 * @param pointsToCalculate The number of points to calculate
 * @returns An object containing the result of the calculation
 */
export function calculateAttractorDensity(
  attractorParams: AttractorParameters,
  densityBuffer: SharedArrayBuffer,
  infoBuffer: SharedArrayBuffer,
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
 * @param densityBuffer SharedArrayBuffer with point density information (accessed as Uint32Array)
 * @param imageBuffer SharedArrayBuffer to store the generated image data (accessed as Uint32Array)
 * @param infoBuffer SharedArrayBuffer with info like maxDensity (accessed as Uint32Array)
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
  densityBuffer: SharedArrayBuffer,
  imageBuffer: SharedArrayBuffer,
  infoBuffer: SharedArrayBuffer,
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
 * @param densityBuffer SharedArrayBuffer to store point density information (accessed as Uint32Array)
 * @param imageBuffer SharedArrayBuffer to store the generated image data (accessed as Uint32Array)
 * @param infoBuffer SharedArrayBuffer with info like maxDensity (accessed as Uint32Array)
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
  densityBuffer: SharedArrayBuffer,
  imageBuffer: SharedArrayBuffer,
  infoBuffer: SharedArrayBuffer,
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
