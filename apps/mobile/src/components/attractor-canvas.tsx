import { View } from 'tamagui';
import { Canvas, Image } from '@shopify/react-native-skia';
import { ProgressBar } from './progress-bar';
// AttractorCanvas renders a full-screen attractor image in a single buffer.

import { useAttractorStore } from '@repo/state/attractor-store';
import { useGlobalStore } from '../store/global-store';
import type { AttractorParameters } from '@repo/core/types';

import { useEffect, useState, useRef } from 'react';
import { runOnUI, runOnJS } from 'react-native-reanimated';
import { Dimensions } from 'react-native';
import type { SkImage } from '@shopify/react-native-skia';
import { Skia, AlphaType, ColorType } from '@shopify/react-native-skia';

const POINTS = 20000000; // Default points for attractor
const POINTS_PER_ITTERATION = 1000000; // Points to generate per chunk
const LOW_RES_POINTS = 200000; // Points for low-res attractor
const LOW_RES_POINTS_PER_ITTERATION = 100000; // Points to generate per chunk (low res)
const SCALE = 150;

// Iterative, chunked attractor image generator using requestAnimationFrame

function useIterativeAttractorImage(
  width: number,
  height: number,
  attractorParameters: AttractorParameters,
  highQuality: boolean,
) {
  const [image, setImage] = useState<SkImage | null>(null);
  const setAttractorProgress = useGlobalStore(s => s.setAttractorProgress);
  const paramsRef = useRef(attractorParameters);
  paramsRef.current = attractorParameters;

  // Calculate attractor on UI thread using a worklet
  useEffect(() => {
    setImage(null);
    setAttractorProgress(0);

    const then = new Date();

    function onDone() {
      console.log(
        'Attractor calculation complete in',
        new Date().valueOf() - then.valueOf(),
        'ms',
      );
    }

    function calculateAttractorWorklet() {
      'worklet';

      // --- Fully inlined helpers and logic ---
      function BezierEasing(
        p0: number,
        p1: number,
        p2: number,
        p3: number,
      ): (x: number) => number {
        function A(aA1: number, aA2: number): number {
          return 1.0 - 3.0 * aA2 + 3.0 * aA1;
        }
        function B(aA1: number, aA2: number): number {
          return 3.0 * aA2 - 6.0 * aA1;
        }
        function C(aA1: number): number {
          return 3.0 * aA1;
        }
        function calcBezier(t: number, aA1: number, aA2: number): number {
          return ((A(aA1, aA2) * t + B(aA1, aA2)) * t + C(aA1)) * t;
        }
        function getSlope(t: number, aA1: number, aA2: number): number {
          return 3.0 * A(aA1, aA2) * t * t + 2.0 * B(aA1, aA2) * t + C(aA1);
        }
        function getTforX(aX: number): number {
          let aGuessT: number = aX;
          for (let i = 0; i < 4; ++i) {
            let currentSlope: number = getSlope(aGuessT, p0, p2);
            if (currentSlope === 0.0) return aGuessT;
            let currentX: number = calcBezier(aGuessT, p0, p2) - aX;
            aGuessT -= currentX / currentSlope;
          }
          return aGuessT;
        }
        return function (x: number): number {
          if (x <= 0) return 0;
          if (x >= 1) return 1;
          return calcBezier(getTforX(x), p1, p3);
        };
      }
      function hsv2rgb(
        h: number,
        s: number,
        v: number,
      ): [number, number, number] {
        let r: number, g: number, b: number;
        let i: number;
        let f: number, p: number, q: number, t: number;
        h = Math.max(0, Math.min(359, h));
        s = Math.max(0, Math.min(100, s));
        v = Math.max(0, Math.min(100, v));
        s /= 100;
        v /= 100;
        if (s === 0) {
          r = g = b = v;
          return [
            Math.round(r * 255),
            Math.round(g * 255),
            Math.round(b * 255),
          ];
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
      function getColorData(
        density: number,
        maxDensity: number,
        h: number,
        s: number,
        v: number,
        progress: number = 1,
        background: number[] = [0, 0, 0, 255],
      ): number {
        const saturationBezier = BezierEasing(0.79, -0.34, 0.54, 1.18);
        const densityBezier = BezierEasing(0.75, 0.38, 0.24, 1.33);
        const opacityBezier = BezierEasing(0.24, 0.27, 0.13, 0.89);
        const mdens: number = Math.log(maxDensity);
        const pdens: number = Math.log(density);
        const [r, g, b]: [number, number, number] = hsv2rgb(
          h,
          s - Math.max(0, Math.min(1, saturationBezier(pdens / mdens))) * s,
          v,
        );
        const density_alpha: number = Math.max(
          0,
          Math.min(1, densityBezier(pdens / mdens)),
        );
        const bgR: number = (background && background[0]) || 0;
        const bgG: number = (background && background[1]) || 0;
        const bgB: number = (background && background[2]) || 0;
        const blendedR: number = Math.round(
          r * density_alpha + bgR * (1 - density_alpha),
        );
        const blendedG: number = Math.round(
          g * density_alpha + bgG * (1 - density_alpha),
        );
        const blendedB: number = Math.round(
          b * density_alpha + bgB * (1 - density_alpha),
        );
        return (
          ((opacityBezier(progress || 1) * 255) << 24) |
          (blendedB << 16) |
          (blendedG << 8) |
          blendedR
        );
      }
      function getLowQualityPoint(
        hue: number,
        saturation: number,
        brightness: number,
      ): number {
        const [r, g, b]: [number, number, number] = hsv2rgb(
          hue || 120,
          saturation || 100,
          brightness || 100,
        );
        return (255 << 24) | (b << 16) | (g << 8) | r;
      }
      function smoothing(num: number, scale: number): number {
        const factor = 0.2;
        return num + (Math.random() < 0.5 ? -factor : factor) * (1 / scale);
      }
      function clifford(
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
      function dejong(
        x: number,
        y: number,
        a: number,
        b: number,
        c: number,
        d: number,
      ): [number, number] {
        return [
          Math.sin(a * y) - Math.cos(b * x),
          Math.sin(c * x) - Math.cos(d * y),
        ];
      }

      const p = attractorParameters || {};
      const attractor = p.attractor || 'clifford';
      const a = typeof p.a === 'number' ? p.a : 1.7;
      const b = typeof p.b === 'number' ? p.b : 1.7;
      const c = typeof p.c === 'number' ? p.c : 0.6;
      const d = typeof p.d === 'number' ? p.d : 1.2;
      const scale = typeof p.scale === 'number' ? p.scale : 1;
      const left = typeof p.left === 'number' ? p.left : 0;
      const top = typeof p.top === 'number' ? p.top : 0;
      const hue = typeof p.hue === 'number' ? p.hue : 120;
      const saturation = typeof p.saturation === 'number' ? p.saturation : 100;
      const brightness = typeof p.brightness === 'number' ? p.brightness : 100;
      const background = Array.isArray(p.background)
        ? p.background
        : [0, 0, 0, 255];
      const fn = attractor === 'clifford' ? clifford : dejong;
      const cx = width / 2 + left;
      const cy = height / 2 + top;
      const s = scale * SCALE;
      const density = new Uint32Array(width * height);
      const imageData = new Uint32Array(width * height);
      let maxDensity = 1;
      let x = 0,
        y = 0;
      let totalPoints = 0;
      const totalAttractorPoints: number = highQuality
        ? POINTS
        : LOW_RES_POINTS;
      const pointsPerIteration: number = highQuality
        ? POINTS_PER_ITTERATION
        : LOW_RES_POINTS_PER_ITTERATION;
      let totalItteration = 0;
      const drawAt = 5;

      runOnJS(setMainImage)(null);

      requestAnimationFrame(function calc() {
        totalItteration++;
        // calculate density for the current iteration
        for (let i = 0; i < pointsPerIteration; i++, totalPoints++) {
          [x, y] = fn(x, y, a, b, c, d);
          const sx = smoothing(x, s);
          const sy = smoothing(y, s);
          const screenX = sx * s;
          const screenY = sy * s;
          const px = Math.floor(cx + screenX);
          const py = Math.floor(cy + screenY);
          if (px >= 0 && px < width && py >= 0 && py < height) {
            const idx = py * width + px;
            density[idx] = (density[idx] || 0) + 1;
            if (density[idx] > maxDensity) maxDensity = density[idx];
          }
        }

        runOnJS(setAttractorProgress)(totalPoints / totalAttractorPoints);

        if (
          totalItteration === 1 ||
          totalItteration % drawAt === 0 ||
          totalPoints === totalAttractorPoints
        ) {
          for (let i = 0; i < width * height; i++) {
            const dval = density[i] || 0;
            imageData[i] =
              dval > 0
                ? highQuality
                  ? getColorData(
                      dval,
                      maxDensity,
                      hue,
                      saturation,
                      brightness,
                      1,
                      background,
                    )
                  : getLowQualityPoint(hue, saturation, brightness)
                : (((background && background[3]) || 0) << 24) |
                  (((background && background[2]) || 0) << 16) |
                  (((background && background[1]) || 0) << 8) |
                  ((background && background[0]) || 0);
          }

          // join is faster than json.stringify for large arrays
          runOnJS(setMainImage)(imageData.join(','));
        }

        if (totalPoints < totalAttractorPoints) {
          requestAnimationFrame(calc);
        } else {
          runOnJS(onDone)();
        }
      });
    }

    runOnUI(calculateAttractorWorklet)();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, attractorParameters, highQuality]);

  function setMainImage(buffer: string | null) {
    if (buffer === null) {
      setImage(null);
      return;
    }

    // setImage(makeSkiaImage(buffer, width, height));
    setImage(
      makeSkiaImage(
        new Uint32Array(buffer.split(',').map(Number)),
        width,
        height,
      ),
    );
  }

  return image;
}

// Convert a Uint32Array RGBA buffer to a Skia image.
// Skia requires width/height to be integers, and stride = width * 4 bytes.
export function makeSkiaImage(
  imageData: Uint32Array,
  width: number = 256,
  height: number = 256,
) {
  const pixels = new Uint8Array(imageData.buffer);
  const data = Skia.Data.fromBytes(pixels);
  const img = Skia.Image.MakeImage(
    {
      width,
      height,
      alphaType: AlphaType.Opaque,
      colorType: ColorType.RGBA_8888,
    },
    data,
    width * 4,
  );
  return img;
}

// AttractorCanvas: renders the attractor using a single image buffer for the entire screen.
// The yellow background is for debugging; remove or change as needed.

export function AttractorCanvas() {
  const { width, height } = Dimensions.get('window');
  const attractorParameters = useAttractorStore(s => s.attractorParameters);
  const [highQuality] = useState(true);
  const image = useIterativeAttractorImage(
    Math.round(width),
    Math.round(height),
    attractorParameters,
    highQuality,
  );

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: 'darkslateblue',
      }}
    >
      <ProgressBar />
      <Canvas style={{ flex: 1, width, height }}>
        {image && (
          <Image
            image={image}
            fit="fill"
            x={0}
            y={0}
            width={width}
            height={height}
          />
        )}
      </Canvas>
    </View>
  );
}
