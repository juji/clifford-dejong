import { useEffect } from "react";
import { useAttractorStore } from "@repo/state/attractor-store";

export function useParamsBackgroundColor() {
  const attractorParameters = useAttractorStore((s) => s.attractorParameters);
  const bgArr = attractorParameters.background;

  // change global background color based on attractor parameters
  const updateBackgroundCSS = () => {
    if (!bgArr || bgArr.length < 3) return;
    
    // Convert RGB array to CSS color format
    const [r, g, b, a = 255] = bgArr;
    const alpha = a / 255;
    const cssColor = `rgba(${r}, ${g}, ${b}, ${alpha})`;
    
    // Update the custom CSS variable for canvas background
    document.documentElement.style.setProperty('--cda-bg-canvas', cssColor);
  };
  
  // Run on mount and when bgArr changes
  useEffect(() => {
    updateBackgroundCSS();
    
    // Return cleanup function to restore original background on unmount
    return () => {
      // Reset custom canvas background variable
      document.documentElement.style.removeProperty('--cda-bg-canvas');
    };
  }, [bgArr]);
  
  // Return the update function in case it's needed elsewhere
  return { updateBackgroundCSS };
}