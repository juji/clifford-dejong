/**
 * Resizes a base64 image to exact specified width using native browser Canvas API
 * @param base64 - The base64 encoded image string
 * @param targetWidth - The exact width in pixels for the output image (default: 500)
 * @returns A promise that resolves to the resized base64 image with exact width
 */
export const resizeBase64Image = async (
  base64: string,
  targetWidth: number = 500,
): Promise<string> => {
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

    // Get the canvas context and draw the resized image
    const ctx = destCanvas.getContext("2d");
    if (!ctx) {
      throw new Error("Could not get canvas context");
    }

    // Use built-in canvas drawing with image smoothing for better quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    // Convert result to base64
    const resizedBase64 = destCanvas.toDataURL("image/png");
    return resizedBase64;
  } catch (error) {
    console.error("Error resizing image with native Canvas API:", error);
    return base64; // Return original if resizing fails
  }
};
