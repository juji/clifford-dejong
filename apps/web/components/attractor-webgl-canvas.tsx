/* eslint-disable */

"use client";
import React, { useRef, useEffect } from "react";
import BezierEasing from "bezier-easing";

// Minimal WebGL Attractor Renderer (Clifford/De Jong)
// This version computes points on the CPU, uploads to GPU as a texture, and uses a fragment shader for color mapping.
// For a full GPU version, the attractor math would be in the shader (possible with WebGL2 or WebGPU).

type GL = WebGLRenderingContext;

const VERT_SHADER = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = (a_position + 1.0) * 0.5;
  gl_Position = vec4(a_position, 0, 1);
}`;

const FRAG_SHADER = `
precision highp float;
varying vec2 v_uv;
uniform sampler2D u_density;
uniform float u_alphaBoost;
// Bezier function for mix control (cubic Bezier)
float cubicBezier(float t, float p0, float p1, float p2, float p3) {
  float u = 1.0 - t;
  return u*u*u*p0 + 3.0*u*u*t*p1 + 3.0*u*t*t*p2 + t*t*t*p3;
}
void main() {
  float d = texture2D(u_density, v_uv).r;
  // Circular mask for perfect circle
  vec2 center = v_uv - vec2(0.5);
  float dist = length(center) / 0.5;
  if (dist > 1.0) discard;
  float norm = d;
  float alpha = u_alphaBoost * pow(norm, 0.7);
  vec3 baseColor = vec3(1.0, 0.1, 0.5); // hot pink
  // Use a Bezier curve to control the mix value
  float bezMix = cubicBezier(norm, 0.0, 0.2, 0.8, 1.0); // You can tweak p1 and p2 for different curves
  vec3 color = mix(baseColor, vec3(1.0), bezMix);
  gl_FragColor = vec4(color, alpha);
}`;

function createShader(gl: GL, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) || "Shader compile error");
  }
  return shader;
}

function createProgram(gl: GL, vertSrc: string, fragSrc: string): WebGLProgram {
  const vert = createShader(gl, gl.VERTEX_SHADER, vertSrc);
  const frag = createShader(gl, gl.FRAGMENT_SHADER, fragSrc);
  const prog = gl.createProgram()!;
  gl.attachShader(prog, vert);
  gl.attachShader(prog, frag);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(prog) || "Program link error");
  }
  return prog;
}

// Clifford attractor function
type CliffordParams = { x: number; y: number; a: number; b: number; c: number; d: number };
function clifford(x: number, y: number, a: number, b: number, c: number, d: number): [number, number] {
  return [
    Math.sin(a * y) + c * Math.cos(a * x),
    Math.sin(b * x) + d * Math.cos(b * y),
  ];
}

interface GenerateDensityParams {
  width: number;
  height: number;
  points: number;
  a: number;
  b: number;
  c: number;
  d: number;
  scale?: number;
}

// Generate density map (CPU)
function generateDensity({
  width,
  height,
  points,
  a,
  b,
  c,
  d,
  scale = 1.5,
}: GenerateDensityParams): { density: Float32Array; maxDensity: number } {
  let x = 0;
  let y = 0;
  const density = new Float32Array(width * height);
  let maxDensity = 0;
  // Centering offset (keep attractor centered)
  const centerX = width / 2;
  const centerY = height / 2;
  // Generate density map (centered)
  for (let i = 0; i < points; i++) {
    const [nx, ny] = clifford(x, y, a, b, c, d);
    x = nx;
    y = ny;
    const screenX = Math.round(x * 140);
    const screenY = Math.round(y * 140);
    const sx = Math.floor(screenX + width / 2);
    const sy = Math.floor(screenY + height / 2);
    if (sx >= 0 && sx < width && sy >= 0 && sy < height) {
      const idx = sx + sy * width;
      density[idx]!++;
      if (density[idx]! > maxDensity) maxDensity = density[idx]!;
    }
  }
  return { density, maxDensity };
}

interface AttractorWebGLCanvasProps {
  width?: number;
  height?: number;
  points?: number;
  a?: number;
  b?: number;
  c?: number;
  d?: number;
  color?: [number, number, number];
  style?: React.CSSProperties;
}

export default function AttractorWebGLCanvas({
  width = 512,
  height = 512,
  points = 50_000_000, // Higher density for solid glow

  // a = -1.4,
  // b = 1.6,
  // c = 1.0,
  // d = 0.7,
  // use the same parameters as the canvas attractor
  a = 2,
  b = -2,
  c = 1,
  d = -1,

  color = [1.0, 0.1, 0.5], // hot pink

  style = {},
}: AttractorWebGLCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl");
    if (!gl) return;
    const prog = createProgram(gl, VERT_SHADER, FRAG_SHADER);
    gl.useProgram(prog);

    // Fullscreen quad
    const posLoc = gl.getAttribLocation(prog, "a_position");
    const posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1,
        1, -1,
        -1, 1,
        -1, 1,
        1, -1,
        1, 1,
      ]),
      gl.STATIC_DRAW
    );
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    // Generate density map
    const { density, maxDensity } = generateDensity({
      width,
      height,
      points,
      a,
      b,
      c,
      d,
      scale: 80, // Make attractor smaller for more glow effect
    });

    // Debug: Log maxDensity and a sample of the density array
    // eslint-disable-next-line no-console
    console.log('maxDensity', maxDensity, 'density sample', Array.from(density).slice(0, 20));

    // Debug: If maxDensity is zero, fill with a test pattern
    let densityBytes: Uint8Array;
    if (maxDensity === 0) {
      densityBytes = new Uint8Array(width * height);
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if ((x + y) % 32 < 16) densityBytes[x + y * width] = 200;
        }
      }
    } else {
      densityBytes = new Uint8Array(width * height);
      for (let i = 0; i < density.length; i++) {
        // Use log mapping as in getColorData
        const mdens = Math.log(maxDensity);
        const pdens = Math.log(density[i]!);
        // Use Bezier curves for color/alpha
        const s = 100 - saturationBezier(pdens / mdens) * 100;
        const v = lightnessBezier(pdens / mdens) * 100;
        const [r, g, b] = hsv2rgb(330, s, v); // 330 = hot pink hue
        densityBytes[i] = Math.max(r, g, b); // Use max channel for grayscale texture
      }
    }

    // Upload density as texture (UNSIGNED_BYTE)
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.LUMINANCE,
      width,
      height,
      0,
      gl.LUMINANCE,
      gl.UNSIGNED_BYTE,
      densityBytes
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // Set uniforms
    gl.uniform1i(gl.getUniformLocation(prog, "u_density"), 0);
    gl.uniform1f(gl.getUniformLocation(prog, "u_maxDensity"), maxDensity);
    gl.uniform3fv(gl.getUniformLocation(prog, "u_color"), color);
    gl.uniform1f(gl.getUniformLocation(prog, "u_alphaBoost"), 5.0); // Try 1.5 for stronger glow

    // Enable additive blending for more glow
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);

    // Draw
    gl.viewport(0, 0, width, height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }, [width, height, points, a, b, c, d, color]);

  return (
    <canvas
      ref={ref}
      width={width}
      height={height}
      style={{ display: "block", background: "black", ...style }}
    />
  );
}

// Bezier curves for color mapping (match core/color.ts)
const saturationBezier = BezierEasing(0.79, -0.34, 0.54, 1.18);
const lightnessBezier = BezierEasing(0.75, 0.38, 0.24, 1.33);
const opacityBezier = BezierEasing(.69,-0.01,.48,.94);

// HSV to RGB (match core/color.ts)
function hsv2rgb(h: number, s: number, v: number): [number, number, number] {
  let r, g, b;
  let i;
  let f, p, q, t;
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
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    default: r = v; g = p; b = q;
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
