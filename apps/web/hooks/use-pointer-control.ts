import { useEffect, useRef, RefObject } from "react";
import { useAttractorStore } from "@repo/state/attractor-store";

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

export function usePointerControl(targetRef: RefObject<HTMLElement | null>) {
  const last = useRef<{ x: number; y: number; top: number; left: number } | null>(null);
  const lastDistance = useRef<number | null>(null);

  const attractorParameters = useAttractorStore((s) => s.attractorParameters);
  const setAttractorParams = useAttractorStore((s) => s.setAttractorParams);
  const { top, left, scale } = attractorParameters;

  useEffect(() => {
    const el = targetRef.current;
    if (!el) return;

    // --- Pointer events for top/left ---
    const onPointerDown = (e: PointerEvent) => {
      if (el.setPointerCapture) {
        el.setPointerCapture(e.pointerId);
      }
      last.current = { x: e.clientX, y: e.clientY, top, left };
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!last.current) return;
      const dx = e.clientX - last.current.x;
      const dy = e.clientY - last.current.y;
      const sensitivity = 0.005;
      setAttractorParams({
        ...attractorParameters,
        left: clamp(last.current.left + dx * sensitivity, -1, 1),
        top: clamp(last.current.top + dy * sensitivity, -1, 1),
      });
    };
    const onPointerUp = (e: PointerEvent) => {
      if (el.releasePointerCapture) {
        el.releasePointerCapture(e.pointerId);
      }
      last.current = null;
      lastDistance.current = null;
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

    // --- Touch for pinch/scale ---
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        if (t1 && t2) {
          lastDistance.current = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        }
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && lastDistance.current !== null) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        if (t1 && t2) {
          const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
          const scaleChange = dist / lastDistance.current;
          setAttractorParams({
            ...attractorParameters,
            scale: clamp(scale * scaleChange, 0.001, 5),
          });
          lastDistance.current = dist;
        }
      }
    };
    const onTouchEnd = () => {
      lastDistance.current = null;
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointerleave", onPointerUp);
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTouchStart);
    el.addEventListener("touchmove", onTouchMove);
    el.addEventListener("touchend", onTouchEnd);

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointerleave", onPointerUp);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [targetRef, attractorParameters, setAttractorParams, top, left, scale]);
}
