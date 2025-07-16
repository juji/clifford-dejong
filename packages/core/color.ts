// Color utilities for attractor rendering
// Includes HSV to RGB conversion and color mapping with Bezier curves

import BezierEasing from "bezier-easing";

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
export const lightnessBezier = BezierEasing(0.75, 0.38, 0.24, 1.33);
export const opacityBezier = BezierEasing(0.69, -0.01, 0.48, 0.94);

// Maps density to color using HSV and Bezier curves with background blending
export function getColorData(
  density: number,
  maxDensity: number,
  h: number,
  s: number,
  v: number,
  progress: number = 1, // Default to full opacity
  background: number[] = [0, 0, 0, 255] // Default background is black
): number {
  const mdens = Math.log(maxDensity);
  const pdens = Math.log(density);

  const [r, g, b] = hsv2rgb(
    h,
    s - saturationBezier(pdens / mdens) * s,
    lightnessBezier(pdens / mdens) * v,
  );

  // Extract background color components with default values
  const bgR = background?.[0] ?? 0;
  const bgG = background?.[1] ?? 0;
  const bgB = background?.[2] ?? 0;
  
  // Calculate a blend factor based on density
  const blendFactor = Math.min(1, pdens / mdens);
  
  // Blend the color with background
  const blendedR = Math.round(r * blendFactor + bgR * (1 - blendFactor));
  const blendedG = Math.round(g * blendFactor + bgG * (1 - blendFactor));
  const blendedB = Math.round(b * blendFactor + bgB * (1 - blendFactor));
  
  // Keep the original opacity calculation exactly as it was
  return ((opacityBezier(progress) * 255) << 24) | (blendedB << 16) | (blendedG << 8) | blendedR;
  // return ((1 * 255) << 24) | (blendedB << 16) | (blendedG << 8) | blendedR;
}
