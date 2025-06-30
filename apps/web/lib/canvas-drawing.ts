import { getColorData } from "@repo/core/color";
import { AttractorParameters } from "@repo/core/types";

export function mainThreadDrawing(
  canvas: HTMLCanvasElement | null,
  pixels: number[],
  maxDensity: number,
  progress: number,
  qualityMode: string,
  attractorParameters: AttractorParameters
) {
  if (!canvas) return;

  const width = canvas.width;
  const height = canvas.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const imageData = ctx.createImageData(width, height);
  const data = new Uint32Array(imageData.data.buffer);
  const bgArr = attractorParameters.background;

  const bgColor =
    (bgArr[3] << 24) | (bgArr[2] << 16) | (bgArr[1] << 8) | bgArr[0];

  if (qualityMode === 'low') {
    for (let i = 0; i < pixels.length; i++) {
      data[i] = (pixels[i] ?? 0) > 0 ? 0xffffffff : bgColor;
    }
  } else {
    for (let i = 0; i < pixels.length; i++) {
      const density = pixels[i] ?? 0;
      if (density > 0) {
        data[i] = getColorData(
          density,
          maxDensity,
          attractorParameters.hue ?? 120,
          attractorParameters.saturation ?? 100,
          attractorParameters.brightness ?? 100,
          progress > 0 ? progress / 100 : 1,
        );
      } else {
        data[i] = bgColor;
      }
    }
  }
  ctx.putImageData(imageData, 0, 0);
}
