import { View } from 'tamagui';
import { Canvas, Image, Rect } from '@shopify/react-native-skia';
// AttractorCanvas renders a full-screen attractor image using tiling to avoid memory/property limits on mobile devices.
// Tiling is necessary because allocating a single large image buffer (width * height) can exceed JS engine limits on mobile.
// Each tile is generated and rendered separately, but the result is visually seamless.

import { useAttractorStore } from '@repo/state/attractor-store';
import { useEffect, useState } from 'react';
import { Dimensions } from 'react-native';
import type { SkImage } from '@shopify/react-native-skia';
import { Skia, AlphaType, ColorType } from '@shopify/react-native-skia';

// Generate a tile of the attractor image.
// width, height: tile size in pixels (must be integers)
// offsetX, offsetY: position of the tile in the full image
// fullWidth, fullHeight: full image size (for centering the box)
// Returns a Uint32Array (1 int per pixel, RGBA packed)
function createExampleImage(
  width: number,
  height: number,
  boxDimension: number = 512,
  offsetX: number = 0,
  offsetY: number = 0,
  fullWidth?: number,
  fullHeight?: number,
): Uint32Array {
  // Note: Always use integer width/height for pixel buffers!
  // See: https://github.com/Shopify/react-native-skia/issues/ for Skia image requirements
  const imageData = new Uint32Array(width * height);
  const W = fullWidth ?? width;
  const H = fullHeight ?? height;
  const centerH = H / 2;
  const centerW = W / 2;
  const topBox = centerH - boxDimension / 2;
  const leftBox = centerW - boxDimension / 2;
  const bottomBox = centerH + boxDimension / 2;
  const rightBox = centerW + boxDimension / 2;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Compute the pixel's position in the full image
      const globalX = x + offsetX;
      const globalY = y + offsetY;
      const index = y * width + x;
      let r = 0,
        g = 0,
        b = 0;
      // Draw a white box in the center of the full image
      if (
        globalX >= leftBox &&
        globalX <= rightBox &&
        globalY >= topBox &&
        globalY <= bottomBox
      ) {
        r = 255;
      }
      imageData[index] = r | (g << 8) | (b << 16) | (255 << 24);
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

  useEffect(() => {
    const newTiles = [];
    // Loop over each tile position
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // Calculate integer offset and size for this tile
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
        // Generate the tile's pixel data for its region of the full image
        const imageData = createExampleImage(
          tileWidth,
          tileHeight,
          256,
          offsetX,
          offsetY,
          Math.round(width),
          Math.round(height),
        );
        // Create a Skia image for this tile
        const img = makeSkiaImage(imageData, tileWidth, tileHeight);
        if (!img) {
          // If Skia image creation fails, log a warning (should not happen with integer sizes)
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
  }, [width, height]);
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
          <Image
            key={`tile-${idx}`}
            image={tile.image}
            fit="fill"
            x={tile.x}
            y={tile.y}
            width={tile.width}
            height={tile.height}
          />
        ))}
      </Canvas>
    </View>
  );
}
