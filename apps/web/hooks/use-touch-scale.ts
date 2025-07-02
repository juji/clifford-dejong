import { useState, useCallback } from "react";

/**
 * Custom hook to handle the pressed state for an interactive element,
 * supporting both touch and mouse events.
 * Returns:
 *   - isPressed: boolean (the current pressed state)
 *   - pressProps: object (props to spread onto the element)
 */
export function useTouchScale() {
  const [isPressed, setIsPressed] = useState(false);

  const handlePressStart = useCallback(() => {
    setIsPressed(true);
  }, []);

  const handlePressEnd = useCallback(() => {
    setIsPressed(false);
  }, []);

  return {
    isPressed,
    pressProps: {
      onMouseDown: handlePressStart,
      onMouseUp: handlePressEnd,
      onMouseLeave: handlePressEnd, // End press if mouse leaves element
      onTouchStart: handlePressStart,
      onTouchEnd: handlePressEnd,
    },
  };
}
