"use client";
import { useEffect, useRef, useState, useMemo } from "react";
import { runAttractorBenchmark } from "@/lib/attractor-benchmark";
import { useAttractorStore } from "@repo/state/attractor-store";
import { useAttractorWorker } from "@/hooks/use-attractor-worker";
import { mainThreadDrawing } from "@/lib/main-thread-drawing";
import { useUIStore } from "@/store/ui-store";
import { usePointerControl } from "@/hooks/use-pointer-control";
import {
  DEFAULT_POINTS,
  DEFAULT_SCALE,
  LOW_QUALITY_POINTS,
  LOW_QUALITY_INTERVAL,
} from "@/lib/constants";
import debounce from "debounce";
import type { AttractorParameters } from "@repo/core/types";
import { useResizeHandler } from "@/hooks/use-resize-handler";
import { useParamsBackgroundColor } from "@/hooks/use-background-color-changer";

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

export function AttractorCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Zustand selectors for attractor state
  const attractorParameters = useAttractorStore((s) => s.attractorParameters);
  const imageUrl = useUIStore((s) => s.imageUrl);
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
      className={`flex items-center justify-center w-full h-full fixed top-0 left-0 ${canvasVisible ? "opacity-100" : "opacity-0"}`}
      ref={containerRef}
      style={
        {
          backgroundColor: "var(--cda-bg-canvas)",
        } as React.CSSProperties
      }
    >
      {/* this is for safari */}
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl || ""}
          alt=""
          aria-hidden="true"
          role="presentation"
          className="absolute inset-0 w-full h-full object-contain"
          style={{ touchAction: "none" }}
        />
      ) : null}
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={ariaLabel}
        style={{ touchAction: "none" }}
        className={`block w-full h-full transition-opacity`}
      />
    </div>
  );
}
