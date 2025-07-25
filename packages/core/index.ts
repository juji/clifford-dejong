// Core mathematical logic for Clifford and de Jong attractors will be placed here.
// Used for the Chaos Canvas visualization

/**
 * Type definition for attractor functions
 * Both clifford and dejong functions conform to this type
 */
export type AttractorFn = (
  x: number,
  y: number,
  a: number,
  b: number,
  c: number,
  d: number
) => [number, number];

export function clifford(
  x: number,
  y: number,
  a: number,
  b: number,
  c: number,
  d: number,
): [number, number] {
  return [
    Math.sin(a * y) + c * Math.cos(a * x),
    Math.sin(b * x) + d * Math.cos(b * y),
  ];
}

export function dejong(
  x: number,
  y: number,
  a: number,
  b: number,
  c: number,
  d: number,
): [number, number] {
  return [
    Math.sin(a * y) - c * Math.cos(b * x),
    Math.sin(c * x) - d * Math.cos(d * y),
  ];
}
