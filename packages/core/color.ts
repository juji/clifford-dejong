// Color utilities for attractor rendering
// Includes HSV to RGB conversion and color mapping with Bezier curves

// Inlined BezierEasing implementation (MIT, adapted from bezier-easing npm)
function BezierEasing(p0: number, p1: number, p2: number, p3: number) {
  function A(aA1: number, aA2: number) {
    return 1.0 - 3.0 * aA2 + 3.0 * aA1;
  }
  function B(aA1: number, aA2: number) {
    return 3.0 * aA2 - 6.0 * aA1;
  }
  function C(aA1: number) {
    return 3.0 * aA1;
  }
  function calcBezier(t: number, aA1: number, aA2: number) {
    return ((A(aA1, aA2) * t + B(aA1, aA2)) * t + C(aA1)) * t;
  }
  function getSlope(t: number, aA1: number, aA2: number) {
    return 3.0 * A(aA1, aA2) * t * t + 2.0 * B(aA1, aA2) * t + C(aA1);
  }
  function getTforX(aX: number) {
    let aGuessT = aX;
    for (let i = 0; i < 4; ++i) {
      let currentSlope = getSlope(aGuessT, p0, p2);
      if (currentSlope === 0.0) return aGuessT;
      let currentX = calcBezier(aGuessT, p0, p2) - aX;
      aGuessT -= currentX / currentSlope;
    }
    return aGuessT;
  }
  return function (x: number) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    return calcBezier(getTforX(x), p1, p3);
  };
}

export function hsv2rgb(
  h: number,
  s: number,
  v: number,
): [number, number, number] {
  let r, g, b;
  let i;
  let f, p, q, t;

  // Clamp arguments
  h = Math.max(0, Math.min(359, h));
  s = Math.max(0, Math.min(100, s));
  v = Math.max(0, Math.min(100, v));

  s /= 100;
  v /= 100;

  if (s === 0) {
    r = g = b = v;
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }

  h /= 60;
  i = Math.floor(h);
  f = h - i;
  p = v * (1 - s);
  q = v * (1 - s * f);
  t = v * (1 - s * (1 - f));

  switch (i) {
    case 0:
      r = v;
      g = t;
      b = p;
      break;
    case 1:
      r = q;
      g = v;
      b = p;
      break;
    case 2:
      r = p;
      g = v;
      b = t;
      break;
    case 3:
      r = p;
      g = q;
      b = v;
      break;
    case 4:
      r = t;
      g = p;
      b = v;
      break;
    default:
      r = v;
      g = p;
      b = q;
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

// Bezier curves for color mapping
export const saturationBezier = BezierEasing(0.79, -0.34, 0.54, 1.18);
export const densityBezier = BezierEasing(0.75, 0.38, 0.24, 1.33);
export const opacityBezier = BezierEasing(0.24, 0.27, 0.13, 0.89);

// Maps density to color using HSV and Bezier curves with background blending
export function getColorData(
  density: number,
  maxDensity: number,
  h: number,
  s: number,
  v: number,
  progress: number = 1, // Default to full opacity
  background: number[] = [0, 0, 0, 255], // Default background is black
): number {
  const mdens = Math.log(maxDensity);
  const pdens = Math.log(density);

  const [r, g, b] = hsv2rgb(
    h,
    s - Math.max(0, Math.min(1, saturationBezier(pdens / mdens))) * s,
    v,
  );

  // Calculate alpha for point density
  const density_alpha = Math.max(0, Math.min(1, densityBezier(pdens / mdens)));

  // Get background color components
  const bgR = background[0] || 0;
  const bgG = background[1] || 0;
  const bgB = background[2] || 0;

  // Blend RGB with background based on density
  const blendedR = Math.round(r * density_alpha + bgR * (1 - density_alpha));
  const blendedG = Math.round(g * density_alpha + bgG * (1 - density_alpha));
  const blendedB = Math.round(b * density_alpha + bgB * (1 - density_alpha));

  // Keep the original opacity calculation for alpha channel
  return (
    ((opacityBezier(progress) * 255) << 24) |
    (blendedB << 16) |
    (blendedG << 8) |
    blendedR
  );
}
