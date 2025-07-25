import { RefObject, useEffect, useRef } from "react";
import debounce from "debounce";
import { useUIStore } from "@/store/ui-store";

export function useResizeHandler(targetRef: RefObject<HTMLElement | null>){

  const canvasSize = useUIStore((s) => s.canvasSize);
  const canvasVisible = useUIStore((s) => s.canvasVisible);
  const setCanvasSize = useUIStore((s) => s.setCanvasSize);
  const setCanvasVisible = useUIStore((s) => s.setCanvasVisible);
  const onInitResize = useUIStore((s) => s.onInitResize);

  // Track canvas visibility state with a ref
  const canvasVisibleRef = useRef(canvasVisible);
  
  useEffect(() => {
    // Early return if target element doesn't exist
    if (!targetRef.current) return;

    // Debounce the actual resize handling
    const debouncedResize = debounce((newSize: { width: number; height: number }) => {
      setCanvasSize(newSize);
      setCanvasVisible(true);
      canvasVisibleRef.current = true;
    }, 500);

    // Function to handle size changes
    const handleResize = (entries: ResizeObserverEntry[]) => {
      const entry = entries[0];
      if (!entry) return;
      
      // Get new dimensions from content rect
      const newSize = {
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      };

      // Only update if size actually changed
      if (
        !canvasSize ||
        newSize.width !== canvasSize.width ||
        newSize.height !== canvasSize.height
      ) {

        // Hide canvas during resize
        if (canvasVisibleRef.current) {
          setCanvasVisible(false);
          canvasVisibleRef.current = false;
          onInitResize?.();
        }

        debouncedResize(newSize);
      }
    };
    
    // Create and configure ResizeObserver
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(targetRef.current);
    
    // Clean up
    return () => {
      resizeObserver.disconnect();
      if (typeof debouncedResize.clear === "function") {
        debouncedResize.clear();
      }
    };
    
  }, [canvasSize, targetRef, onInitResize, setCanvasSize, setCanvasVisible]);

  return null

}