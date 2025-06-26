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

// Maps density to color using HSV and Bezier curves
export function getColorData(
  density: number,
  maxDensity: number,
  h: number,
  s: number,
  v: number,
): number {
  const mdens = Math.log(maxDensity);
  const pdens = Math.log(density);

  const [r, g, b] = hsv2rgb(
    h,
    s - saturationBezier(pdens / mdens) * s,
    lightnessBezier(pdens / mdens) * v,
  );

  return (255 << 24) | (b << 16) | (g << 8) | r;
}
