import { View } from 'tamagui';
import { Canvas, Image, Rect } from '@shopify/react-native-skia';
// AttractorCanvas renders a full-screen attractor image in a single buffer.

import { useAttractorStore } from '@repo/state/attractor-store';
import type { AttractorParameters } from '@repo/core/types';
import { clifford, dejong } from '@repo/core';
import { getColorData } from '@repo/core/color';
import { useEffect, useState } from 'react';
import { Dimensions } from 'react-native';
import type { SkImage } from '@shopify/react-native-skia';
import { Skia, AlphaType, ColorType } from '@shopify/react-native-skia';

const POINTS = 3000000; // Default points for attractor
const SCALE = 100;

// Minimal, single-buffer attractor image generator
function createAttractorImage(
  width: number,
  height: number,
  attractorParameters: AttractorParameters,
): Uint32Array {
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
  } = attractorParameters;
  const fn = attractor === 'clifford' ? clifford : dejong;
  const cx = width / 2 + left;
  const cy = height / 2 + top;
  const s = scale * SCALE;
  const density = new Uint32Array(width * height);
  let maxDensity = 1;
  let x = 0,
    y = 0;
  for (let i = 0; i < POINTS; i++) {
    [x, y] = fn(x, y, a, b, c, d);
    const sx = x * s;
    const sy = y * s;
    const px = Math.floor(cx + sx);
    const py = Math.floor(cy + sy);
    if (px >= 0 && px < width && py >= 0 && py < height) {
      const idx = py * width + px;
      density[idx] = (density[idx] || 0) + 1;
      if (density[idx] > maxDensity) maxDensity = density[idx];
    }
  }
  const imageData = new Uint32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const d = density[i] ?? 0;
    imageData[i] =
      d > 0
        ? getColorData(
            d,
            maxDensity,
            hue,
            saturation,
            brightness,
            1,
            background,
          )
        : (background[3] << 24) |
          (background[2] << 16) |
          (background[1] << 8) |
          background[0];
  }
  return imageData;
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

// Render the full attractor image in a single buffer
function useFullAttractorImage() {
  const { width, height } = Dimensions.get('window');
  const attractorParameters = useAttractorStore(s => s.attractorParameters);
  const [image, setImage] = useState<SkImage | null>(null);

  useEffect(() => {
    const imageData = createAttractorImage(
      Math.round(width),
      Math.round(height),
      attractorParameters,
    );
    const img = makeSkiaImage(imageData, Math.round(width), Math.round(height));
    setImage(img);
  }, [width, height, attractorParameters]);
  return image;
}

// AttractorCanvas: renders the attractor using a single image buffer for the entire screen.
// The yellow background is for debugging; remove or change as needed.

export function AttractorCanvas() {
  const { width, height } = Dimensions.get('window');
  const image = useFullAttractorImage();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: 'yellow',
      }}
    >
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
