import { View } from 'tamagui';
import { Canvas, Image, Rect } from '@shopify/react-native-skia';
// AttractorCanvas renders a full-screen attractor image using tiling to avoid memory/property limits on mobile devices.
// Tiling is necessary because allocating a single large image buffer (width * height) can exceed JS engine limits on mobile.
// Each tile is generated and rendered separately, but the result is visually seamless.

import { useAttractorStore } from '@repo/state/attractor-store';
import { clifford, dejong } from '@repo/core';
import { getColorData } from '@repo/core/color';
import { useEffect, useState } from 'react';
import { Dimensions } from 'react-native';
import type { SkImage } from '@shopify/react-native-skia';
import { Skia, AlphaType, ColorType } from '@shopify/react-native-skia';

// Generate a tile of the attractor image.
// width, height: tile size in pixels (must be integers)
// offsetX, offsetY: position of the tile in the full image
// fullWidth, fullHeight: full image size (for centering the box)
// Returns a Uint32Array (1 int per pixel, RGBA packed)
// Generate a tile of the attractor image using canonical attractor/color code and attractorParameters from store
// Global density buffer for seamless tiling
let globalDensityBuffer: Uint32Array | null = null;
let globalMaxDensity: number = 1;
let globalDensityParams: string = '';

function computeGlobalDensityBuffer(
  fullWidth: number,
  fullHeight: number,
  attractorParameters: any,
) {
  // Unpack parameters
  const {
    attractor,
    a,
    b,
    c,
    d,
    scale = 1,
    left = 0,
    top = 0,
    points = 3000000,
  } = attractorParameters;
  const fn = attractor === 'clifford' ? clifford : dejong;
  const SCALE = 120;
  const cx = fullWidth / 2 + left;
  const cy = fullHeight / 2 + top;
  const s = scale * SCALE;
  const density = new Uint32Array(fullWidth * fullHeight);
  let maxDensity = 1;
  let x = 0,
    y = 0;
  for (let i = 0; i < points; i++) {
    [x, y] = fn(x, y, a, b, c, d);
    const sx = x * s;
    const sy = y * s;
    const px = Math.floor(cx + sx);
    const py = Math.floor(cy + sy);
    if (px >= 0 && px < fullWidth && py >= 0 && py < fullHeight) {
      const idx = py * fullWidth + px;
      density[idx] = (density[idx] || 0) + 1;
      if (density[idx] > maxDensity) maxDensity = density[idx];
    }
  }
  globalDensityBuffer = density;
  globalMaxDensity = maxDensity;
  globalDensityParams = JSON.stringify({
    fullWidth,
    fullHeight,
    ...attractorParameters,
  });
}

function createAttractorTile(
  width: number,
  height: number,
  offsetX: number,
  offsetY: number,
  fullWidth: number,
  fullHeight: number,
  attractorParameters: any,
): Uint32Array {
  // Ensure global density buffer is up to date
  const paramKey = JSON.stringify({
    fullWidth,
    fullHeight,
    ...attractorParameters,
  });
  if (!globalDensityBuffer || globalDensityParams !== paramKey) {
    computeGlobalDensityBuffer(fullWidth, fullHeight, attractorParameters);
  }
  const {
    hue = 120,
    saturation = 100,
    brightness = 100,
    background = [0, 0, 0, 255],
  } = attractorParameters;
  const imageData = new Uint32Array(width * height);
  // Copy region from global density buffer and colorize
  for (let ty = 0; ty < height; ty++) {
    for (let tx = 0; tx < width; tx++) {
      const gx = offsetX + tx;
      const gy = offsetY + ty;
      const gidx = gy * fullWidth + gx;
      const d =
        globalDensityBuffer && globalDensityBuffer[gidx]
          ? globalDensityBuffer[gidx]
          : 0;
      const idx = ty * width + tx;
      if (d > 0) {
        imageData[idx] = getColorData(
          d,
          globalMaxDensity,
          hue,
          saturation,
          brightness,
          1,
          background,
        );
      } else {
        imageData[idx] =
          (background[3] << 24) |
          (background[2] << 16) |
          (background[1] << 8) |
          background[0];
      }
    }
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
  // Skia expects Uint8Array for pixel data
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

// useAttractorTiles divides the screen into tiles for memory-safe, crisp rendering.
// - maxTileSize: controls the largest tile size (adjust for memory/performance)
// - cols/rows: number of tiles horizontally/vertically
// - All tile sizes and offsets are rounded to integers for Skia compatibility
// - This avoids JS array property/memory limits on mobile
function useAttractorTiles() {
  // React Native's Dimensions.get('window') can return fractional values due to device pixel ratio/scaling.
  // Always round to integers for pixel-based APIs!
  const { width, height } = Dimensions.get('window');
  const maxTileSize = 512;
  const cols = Math.ceil(width / maxTileSize);
  const rows = Math.ceil(height / maxTileSize);
  const [tiles, setTiles] = useState<
    Array<{
      image: SkImage;
      x: number;
      y: number;
      width: number;
      height: number;
    }>
  >([]);
  const attractorParameters = useAttractorStore(s => s.attractorParameters);

  useEffect(() => {
    const newTiles = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        let offsetX = Math.round(col * maxTileSize);
        let offsetY = Math.round(row * maxTileSize);
        let tileWidth, tileHeight;
        if (col === cols - 1) {
          tileWidth = Math.round(width - offsetX);
        } else {
          tileWidth = Math.round(maxTileSize);
        }
        if (row === rows - 1) {
          tileHeight = Math.round(height - offsetY);
        } else {
          tileHeight = Math.round(maxTileSize);
        }
        tileWidth = Math.max(1, tileWidth);
        tileHeight = Math.max(1, tileHeight);
        offsetX = Math.max(0, offsetX);
        offsetY = Math.max(0, offsetY);
        // Generate the tile's pixel data for its region of the full image using attractorParameters
        const imageData = createAttractorTile(
          tileWidth,
          tileHeight,
          offsetX,
          offsetY,
          Math.round(width),
          Math.round(height),
          attractorParameters,
        );
        const img = makeSkiaImage(imageData, tileWidth, tileHeight);
        if (!img) {
          console.warn(`Skia image creation failed for tile [${row},${col}]`);
        }
        newTiles.push({
          image: img as SkImage,
          x: offsetX,
          y: offsetY,
          width: tileWidth,
          height: tileHeight,
        });
      }
    }
    setTiles(newTiles);
    return () => setTiles([]);
  }, [width, height, attractorParameters]);
  return tiles;
}

// AttractorCanvas: renders the attractor using tiling for memory safety and crispness on all devices.
// - The yellow background is for debugging; remove or change as needed.
// - Each tile is rendered in its correct position, filling the screen seamlessly.
export function AttractorCanvas() {
  const { width, height } = Dimensions.get('window');
  const {
    attractorParameters: { background },
  } = useAttractorStore();
  const tiles = useAttractorTiles();

  // Convert [r,g,b,a] (0-255) to rgba() string for Skia
  const bgColor = `rgba(${background[0]},${background[1]},${background[2]},${background[3] / 255})`;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: 'yellow', // For debugging: shows if any tile is missing
      }}
    >
      <Canvas style={{ flex: 1, width, height }}>
        {/* 
          Fill the canvas with the attractor background color 
          To ensure the backround will fully cover the canvas
          This is important for cases where tiles do not fill the entire screen.
          (some screens have fractional dimensions)
        */}
        <Rect x={0} y={0} width={width} height={height} color={bgColor} />
        {tiles.map((tile, idx) => (
          <>
            <Image
              key={`tile-img-${idx}`}
              image={tile.image}
              fit="fill"
              x={tile.x}
              y={tile.y}
              width={tile.width}
              height={tile.height}
            />
            {/* Draw a red border around each tile for debugging */}
            <Rect
              key={`tile-border-${idx}`}
              x={tile.x}
              y={tile.y}
              width={tile.width}
              height={tile.height}
              color="red"
              style="stroke"
              strokeWidth={2}
            />
          </>
        ))}
      </Canvas>
    </View>
  );
}
