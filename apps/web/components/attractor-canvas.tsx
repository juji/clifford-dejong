"use client";
import { useRef, useMemo } from "react";
import { useAttractorStore } from "@repo/state/attractor-store";
import { useUIStore } from "@/store/ui-store";
import { usePointerControl } from "@/hooks/use-pointer-control";
import type { AttractorParameters } from "@repo/core/types";
import { useResizeHandler } from "@/hooks/use-resize-handler";
import { useParamsBackgroundColor } from "@/hooks/use-background-color-changer";
import { AttractorCanvasDynamic } from "./attractor-canvas-dynamic";
import { cn } from "@/lib/utils";

/**
 * Generates a descriptive label for the attractor visualization for screen readers
 */
function generateAttractorDescription(params: AttractorParameters): string {
  const {
    attractor = "unknown",
    a,
    b,
    c,
    d,
    hue,
    saturation,
    brightness,
  } = params;
  const attractorType = attractor
    ? attractor.charAt(0).toUpperCase() + attractor.slice(1)
    : "Unknown";

  return `An abstract geometric pattern generated with ${attractorType} attractor. Parameters: a=${a.toFixed(1)}, b=${b.toFixed(1)}, c=${c.toFixed(1)}, d=${d.toFixed(1)}. Colors: hue=${hue}°, saturation=${saturation}%, brightness=${brightness}%.`;
}

function AttractorImage() {
  const imageUrl = useUIStore((s) => s.imageUrl);
  return (
    // this is for safari to show the image in the background
    imageUrl ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl || ""}
        alt=""
        aria-hidden="true"
        role="presentation"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{ touchAction: "none" }}
      />
    ) : null
  );
}

export function AttractorCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Zustand selectors for attractor state
  const attractorParameters = useAttractorStore((s) => s.attractorParameters);
  const canvasVisible = useUIStore((s) => s.canvasVisible);

  // Generate accessible description for the attractor visualization
  const ariaLabel = useMemo(
    () => generateAttractorDescription(attractorParameters),
    [attractorParameters],
  );

  // handle pointer conrtrol
  usePointerControl(containerRef);

  // handle resize and canvas visibility in zustand
  useResizeHandler(containerRef);

  // Use the hook to update the CSS variable when attractor background changes
  useParamsBackgroundColor();

  return (
    <div
      className={cn(
        `flex items-center justify-center 
        w-full h-full fixed top-0 left-0 
        cursor-grab active:cursor-grabbing`,
        `${canvasVisible ? "opacity-100" : "opacity-0"}`,
      )}
      ref={containerRef}
      style={
        {
          backgroundColor: "var(--cda-bg-canvas)",
        } as React.CSSProperties
      }
    >
      <AttractorImage />
      <AttractorCanvasDynamic ariaLabel={ariaLabel} />
      {/* <AttractorCanvasDynamic /> */}
    </div>
  );
}
