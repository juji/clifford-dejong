import { View } from 'tamagui';
import { Canvas, Image } from '@shopify/react-native-skia';

// import { useAttractorStore } from '@repo/state/attractor-store';
// import { createExampleImage, makeGridImage } from '@/lib/skia-image';
import { useEffect, useState } from 'react';
import { Dimensions } from 'react-native';
import type { SkImage } from '@shopify/react-native-skia';
import { Skia, AlphaType, ColorType } from '@shopify/react-native-skia';

function createExampleImage(
  width: number,
  height: number,
  boxDimension: number = 512,
  offsetX: number = 0,
  offsetY: number = 0,
  fullWidth?: number,
  fullHeight?: number,
): Uint32Array {
  // fullWidth/fullHeight are the dimensions of the full image, used for centering the box
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

function useAttractorTiles() {
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
    console.log(
      'Tiling: screen',
      width,
      height,
      'maxTileSize',
      maxTileSize,
      'cols',
      cols,
      'rows',
      rows,
    );
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
        console.log(
          `Generating tile [${row},${col}] at (${offsetX},${offsetY}) size ${tileWidth}x${tileHeight}`,
        );
        const imageData = createExampleImage(
          tileWidth,
          tileHeight,
          256,
          offsetX,
          offsetY,
          Math.round(width),
          Math.round(height),
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
    console.log('Tiles generated:', newTiles.length);
    setTiles(newTiles);
    return () => setTiles([]);
  }, [width, height]);
  return tiles;
}

export function AttractorCanvas() {
  const { width, height } = Dimensions.get('window');
  const tiles = useAttractorTiles();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: 'yellow',
      }}
    >
      <Canvas style={{ flex: 1, width, height }}>
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
