import { Skia, AlphaType, ColorType } from '@shopify/react-native-skia';

export function makeImage(
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

export function makeDefaultImage() {
  const pixels = new Uint8Array(256 * 256 * 4);
  pixels.fill(255);
  let i = 0;
  for (let x = 0; x < 256; x++) {
    for (let y = 0; y < 256; y++) {
      pixels[i++] = (x * y) % 255;
    }
  }

  const data = Skia.Data.fromBytes(pixels);
  const img = Skia.Image.MakeImage(
    {
      width: 256,
      height: 256,
      alphaType: AlphaType.Opaque,
      colorType: ColorType.RGBA_8888,
    },
    data,
    256 * 4,
  );

  return img;
}
