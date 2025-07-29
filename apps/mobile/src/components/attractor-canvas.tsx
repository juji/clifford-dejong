import { View } from 'tamagui';
import { Canvas, Image } from '@shopify/react-native-skia';
import { ProgressBar } from './progress-bar';
// AttractorCanvas renders a full-screen attractor image in a single buffer.

import { useAttractorStore } from '@repo/state/attractor-store';
import { useGlobalStore } from '../store/global-store';
import type { AttractorParameters } from '@repo/core/types';
import { clifford, dejong } from '@repo/core';
import { getColorData, hsv2rgb } from '@repo/core/color';
import { useEffect, useState, useRef } from 'react';
import { Dimensions } from 'react-native';
import type { SkImage } from '@shopify/react-native-skia';
import { Skia, AlphaType, ColorType } from '@shopify/react-native-skia';

const POINTS = 20000000; // Default points for attractor
const POINTS_PER_ITTERATION = 1000000; // Points to generate per
const LOW_RES_POINTS = 200000; // Points for low-res attractor
const LOW_RES_POINTS_PER_ITTERATION = 100000; // Points to generate per
const SCALE = 150;

function smoothing(num: number, scale: number): number {
  return num + (Math.random() < 0.5 ? -0.2 : 0.2) * (1 / scale);
}

function getLowQualityPoint(
  hue: number,
  saturation: number,
  brightness: number,
) {
  const [r, g, b] = hsv2rgb(hue || 120, saturation || 100, brightness || 100);
  return (255 << 24) | (b << 16) | (g << 8) | r;
}

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

  useEffect(() => {
    let cancelled = false;
    // Double points per iteration for faster chunking
    const totalAttractorPoints = highQuality ? POINTS : LOW_RES_POINTS;
    const attractorPointPerIteration = highQuality
      ? POINTS_PER_ITTERATION
      : LOW_RES_POINTS_PER_ITTERATION;
    setAttractorProgress(0);

    const {
      attractor = 'clifford',
      a,
      b,
      c,
      d,
      scale = 1,
      left = 0,
      top = 0,
      hue = 120,
      saturation = 100,
      brightness = 100,
      background = [0, 0, 0, 255],
    } = paramsRef.current;
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
    const drawIteration = 10; // Number of iterations to draw in each chunk
    let currentItteration = 0;

    function drawChunk() {
      if (cancelled) return;

      for (
        let i = 0;
        i < attractorPointPerIteration && totalPoints < totalAttractorPoints;
        i++, totalPoints++
      ) {
        [x, y] = fn(x, y, a, b, c, d);
        const sx = smoothing(x * s, s);
        const sy = smoothing(y * s, s);
        const px = Math.floor(cx + sx);
        const py = Math.floor(cy + sy);
        if (px >= 0 && px < width && py >= 0 && py < height) {
          const idx = py * width + px;
          density[idx] = (density[idx] || 0) + 1;
          if (density[idx] > maxDensity) maxDensity = density[idx];
        }
      }

      // Update progress in Zustand
      const progress = Math.min(1, totalPoints / totalAttractorPoints);
      setAttractorProgress(progress);

      currentItteration++;
      // Only update image if progress increased by at least 5% or finished
      if (
        currentItteration === 1 ||
        currentItteration % drawIteration === 0 ||
        progress === 1
      ) {
        for (let i = 0; i < width * height; i++) {
          const d = density[i] ?? 0;
          imageData[i] =
            d > 0
              ? highQuality
                ? getColorData(
                    d,
                    maxDensity,
                    hue,
                    saturation,
                    brightness,
                    1,
                    background,
                  )
                : getLowQualityPoint(hue, saturation, brightness)
              : (background[3] << 24) |
                (background[2] << 16) |
                (background[1] << 8) |
                background[0];
        }

        setImage(makeSkiaImage(imageData, width, height));
      }
      if (totalPoints < totalAttractorPoints) {
        requestAnimationFrame(drawChunk);
      } else {
        setAttractorProgress(1);
        // Final image update
        for (let i = 0; i < width * height; i++) {
          const d = density[i] ?? 0;
          imageData[i] =
            d > 0
              ? highQuality
                ? getColorData(
                    d,
                    maxDensity,
                    hue,
                    saturation,
                    brightness,
                    1,
                    background,
                  )
                : getLowQualityPoint(hue, saturation, brightness)
              : (background[3] << 24) |
                (background[2] << 16) |
                (background[1] << 8) |
                background[0];
        }
        setImage(makeSkiaImage(imageData, width, height));
      }
    }
    setImage(null);
    setAttractorProgress(0);
    requestAnimationFrame(drawChunk);
    return () => {
      cancelled = true;
    };
  }, [width, height, attractorParameters, highQuality]);
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
        backgroundColor: 'yellow',
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
