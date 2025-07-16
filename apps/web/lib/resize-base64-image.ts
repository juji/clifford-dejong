import Pica from "pica";

/**
 * Resizes a base64 image to exact specified width using Pica
 * @param base64 - The base64 encoded image string
 * @param targetWidth - The exact width in pixels for the output image (default: 500)
 * @returns A promise that resolves to the resized base64 image with exact width
 */
export const resizeBase64Image = async (
  base64: string,
  targetWidth: number = 500,
): Promise<string> => {
  // Create pica instance with default settings
  const pica = new Pica();

  try {
    // Convert base64 to Image object
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = base64;
    });

    // Calculate height to maintain aspect ratio
    const aspectRatio = img.height / img.width;
    const targetHeight = Math.round(targetWidth * aspectRatio);

    // Create destination canvas with the exact target dimensions
    const destCanvas = document.createElement("canvas");
    destCanvas.width = targetWidth;
    destCanvas.height = targetHeight;

    // Use pica to resize - this guarantees the exact output dimensions
    // because we've preset the destination canvas size
    const result = await pica.resize(img, destCanvas, {
      unsharpAmount: 80,
      unsharpRadius: 0.6,
      unsharpThreshold: 2,
    });

    // Convert result to base64
    const resizedBase64 = result.toDataURL("image/png");
    return resizedBase64;
  } catch (error) {
    console.error("Error resizing image with Pica:", error);
    return base64; // Return original if resizing fails
  }
};
