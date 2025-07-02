import { useEffect, useState, useCallback } from "react";

/**
 * Custom hook to handle touch scaling logic for buttons.
 * Returns:
 *   - scaleClass: string (the current scale class)
 *   - handleTouchStart: (e) => void
 *   - handleTouchEnd: (e) => void
 */
export function useTouchScale() {
  const [scaleClass, setScaleClass] = useState("scale-60");

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      const isTouch = window.matchMedia("(pointer: coarse), (pointer: none)").matches;
      setScaleClass(isTouch ? "scale-75" : "scale-60");
    }
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLElement>) => {
    e.currentTarget.classList.remove("scale-75");
    e.currentTarget.classList.add("scale-60");
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLElement>) => {
    e.currentTarget.classList.remove("scale-60");
    e.currentTarget.classList.add("scale-75");
  }, []);

  return { scaleClass, handleTouchStart, handleTouchEnd };
}
