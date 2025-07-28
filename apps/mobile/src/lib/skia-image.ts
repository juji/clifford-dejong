import { Skia, AlphaType, ColorType } from '@shopify/react-native-skia';
import type { SkImage } from '@shopify/react-native-skia';

export type GridImage = {
  cells: SkImage[];
  rows: number;
  width: number;
  height: number;
};

export function makeGridImage(
  original: Uint32Array,
  originalWidth: number,
  originalHeight: number,
  rows = 8,
): GridImage {
  const width = originalWidth;
  const height = originalHeight / rows;

  const cells = new Array<SkImage>(rows);

  // split the image into rows
  for (let row = 0; row < rows; row++) {
    const startY = row * height;
    const endY = startY + height;
    const rowData = new Uint32Array(
      original.slice(startY * originalWidth, endY * originalWidth),
    );
    const img = Skia.Image.MakeImage(
      {
        width,
        height,
        alphaType: AlphaType.Opaque,
        colorType: ColorType.RGBA_8888,
      },
      Skia.Data.fromBytes(new Uint8Array(rowData.buffer)),
      width * 4,
    );
    cells[row] = img as SkImage;
  }

  return {
    cells,
    rows,
    width,
    height,
  };
}

export function createExampleImage(
  width: number,
  height: number,
  boxDimension: number = 512,
): Uint32Array {
  const imageData = new Uint32Array(width * height);

  const centerH = height / 2;
  const centerW = width / 2;
  const topBox = centerH - boxDimension / 2;
  const leftBox = centerW - boxDimension / 2;
  const bottomBox = centerH + boxDimension / 2;
  const rightBox = centerW + boxDimension / 2;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;

      // Create a black image
      let r = 0;
      let g = 0;
      let b = 0;

      if (x >= leftBox && x <= rightBox && y >= topBox && y <= bottomBox) {
        r = 255;
      }

      imageData[index] = r | (g << 8) | (b << 16) | (255 << 24); // RGBA
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
