import { Skia, AlphaType, ColorType } from '@shopify/react-native-skia';

/**
 * Resize an RGBA image buffer using Skia and return PNG bytes.
 * @param imageData RGBA buffer (Uint8Array, length = srcWidth * srcHeight * 4)
 * @param srcWidth Source image width
 * @param srcHeight Source image height
 * @param targetWidth Target width
 * @param targetHeight Target height
 * @returns Uint8Array (PNG bytes of resized image)
 */
export function resizeImageData(
  imageData: Uint8Array,
  srcWidth: number,
  srcHeight: number,
  targetWidth: number,
): Uint8Array {
  // Create Skia image from RGBA buffer
  const skData = Skia.Data.fromBytes(imageData);
  const srcImage = Skia.Image.MakeImage(
    {
      width: srcWidth,
      height: srcHeight,
      alphaType: AlphaType.Opaque,
      colorType: ColorType.RGBA_8888,
    },
    skData,
    srcWidth * 4,
  );
  if (!srcImage) throw new Error('Failed to create Skia image');

  // Calculate targetHeight to preserve aspect ratio
  const targetHeight = Math.round(srcHeight * (targetWidth / srcWidth));

  // Create target surface
  const surface = Skia.Surface.Make(targetWidth, targetHeight);
  if (!surface) throw new Error('Failed to create Skia surface');
  const canvas = surface.getCanvas();

  // Draw and scale
  const paint = Skia.Paint();
  canvas.drawImageRect(
    srcImage,
    { x: 0, y: 0, width: srcWidth, height: srcHeight },
    { x: 0, y: 0, width: targetWidth, height: targetHeight },
    paint,
  );

  // Snapshot and encode
  const resizedImage = surface.makeImageSnapshot();
  if (!resizedImage) throw new Error('Failed to snapshot resized image');
  const pngBytes = resizedImage.encodeToBytes();
  if (!pngBytes) throw new Error('Failed to encode PNG');
  return pngBytes;
}
