import { useUIStore } from "@/store/ui-store";
import { resizeBase64Image } from "@/lib/resize-base64-image-native";

export async function waitForImage(): Promise<string> {
  let currentImageUrl = useUIStore.getState().imageUrl;
  if (currentImageUrl) {
    // If imageUrl is already available, return it immediately
    return await resizeBase64Image(currentImageUrl);
  }

  // Otherwise, wait for imageUrl to become available in the store
  return new Promise((resolve) => {
    // Set up an interval to check for imageUrl
    const checkInterval = setInterval(async () => {
      currentImageUrl = useUIStore.getState().imageUrl;
      if (currentImageUrl) {
        clearInterval(checkInterval);
        resolve(await resizeBase64Image(currentImageUrl));
      }
    }, 333); // Check every 500ms
  });
}
