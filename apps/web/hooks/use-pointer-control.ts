import { useEffect, useRef, RefObject } from "react";
import { useAttractorStore } from "@repo/state/attractor-store";
import { useUIStore } from "@/store/ui-store";

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

// translate
function getNewTopLeftPosition(
  deltaMouse: { x: number; y: number },
  screen: { width: number; height: number },
  currentValues: { top: number; left: number }, // these should be -1 to 1
) {
  return {
    top: clamp(currentValues.top + deltaMouse.y / screen.height, -1, 1),
    left: clamp(currentValues.left + deltaMouse.x / screen.width, -1, 1),
  };
}

export function usePointerControl(targetRef: RefObject<HTMLElement | null>) {
  const last = useRef<{
    x: number;
    y: number;
    top: number;
    left: number;
  } | null>(null);
  const lastDistance = useRef<number | null>(null);
  const dragging = useRef(false);

  const attractorParameters = useAttractorStore((s) => s.attractorParameters);
  const setAttractorParams = useAttractorStore((s) => s.setAttractorParams);
  const { top, left, scale } = attractorParameters;

  const setQualityMode = useUIStore((s) => s.setQualityMode);

  useEffect(() => {
    const el = targetRef.current;
    if (!el) return;

    // --- Mouse events for top/left ---
    const onMouseDown = (e: MouseEvent) => {
      dragging.current = true;
      last.current = { x: e.clientX, y: e.clientY, top, left };
      setQualityMode("low");
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current || !el || !last.current) return;
      const deltaMouse = {
        x: e.clientX - last.current.x,
        y: e.clientY - last.current.y,
      };
      const rect = el.getBoundingClientRect();
      const screen = { width: rect.width, height: rect.height };
      const { top: newTop, left: newLeft } = getNewTopLeftPosition(
        deltaMouse,
        screen,
        { top: last.current.top, left: last.current.left },
      );
      setAttractorParams({
        ...attractorParameters,
        left: newLeft,
        top: newTop,
      });
    };
    const onMouseUp = () => {
      dragging.current = false;
      last.current = null;
      setQualityMode("high");
    };

    // --- Wheel for scale ---
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY * 0.001;
      setAttractorParams({
        ...attractorParameters,
        scale: clamp(scale * (1 + delta), 0.001, 5),
      });
    };

    // --- Touch for top/left and pinch/scale ---
    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 1) {
        const t = e.touches[0];
        if (t) {
          dragging.current = true;
          last.current = { x: t.clientX, y: t.clientY, top, left };
          setQualityMode("low");
        }
      } else if (e.touches.length === 2) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        if (t1 && t2) {
          lastDistance.current = Math.hypot(
            t1.clientX - t2.clientX,
            t1.clientY - t2.clientY,
          );
        }
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 1 && dragging.current && el && last.current) {
        const t = e.touches[0];
        if (t) {
          const deltaMouse = {
            x: t.clientX - last.current.x,
            y: t.clientY - last.current.y,
          };
          const rect = el.getBoundingClientRect();
          const screen = { width: rect.width, height: rect.height };
          const { top: newTop, left: newLeft } = getNewTopLeftPosition(
            deltaMouse,
            screen,
            { top: last.current.top, left: last.current.left },
          );
          setAttractorParams({
            ...attractorParameters,
            left: newLeft,
            top: newTop,
          });
        }
      } else if (e.touches.length === 2 && lastDistance.current !== null) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        if (t1 && t2) {
          const dist = Math.hypot(
            t1.clientX - t2.clientX,
            t1.clientY - t2.clientY,
          );
          const scaleChange = dist / lastDistance.current;
          setAttractorParams({
            ...attractorParameters,
            scale: clamp(scale * scaleChange, 0.001, 5),
          });
          lastDistance.current = dist;
        }
      }
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        dragging.current = false;
        last.current = null;
        setQualityMode("high");
      }
      lastDistance.current = null;
    };

    el.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: false });

    return () => {
      el.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [
    targetRef,
    attractorParameters,
    setAttractorParams,
    top,
    left,
    scale,
    setQualityMode,
  ]);
}
