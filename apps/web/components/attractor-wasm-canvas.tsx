"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useWasmAttractor } from "../hooks/use-wasm-attractor";
import { useAttractorStore } from "@repo/state/attractor-store";
import { useUIStore } from "../store/ui-store";
import { DEFAULT_SCALE } from "@/lib/constants";

export function AttractorWasmCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    isReady,
    isCalculating,
    error,
    performanceRating,
    calculateAttractor,
    getBuffers,
  } = useWasmAttractor();

  // Get UI store progress setter and current progress
  const setProgress = useUIStore((state) => state.setProgress);
  const progress = useUIStore((state) => state.progress);

  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 800 });
  const attractorParams = useAttractorStore(
    (state) => state.attractorParameters,
  );

  // Handle window resize to always keep canvas at 100% of container
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const parent = canvasRef.current.parentElement;
        if (parent) {
          const { width, height } = parent.getBoundingClientRect();
          setCanvasSize({ width, height });
        }
      }
    };

    // Also listen to window resize events
    window.addEventListener("resize", handleResize);
    // Initial size setup
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Render the attractor to canvas
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const buffers = getBuffers();
    if (!buffers) return;

    const { imageBuffer } = buffers;

    const imageData = ctx.createImageData(canvasSize.width, canvasSize.height);
    const dst = new Uint32Array(imageData.data.buffer);
    dst.set(new Uint32Array(imageBuffer));
    ctx.putImageData(imageData, 0, 0);

    // Draw the image data to the canvas
    // ctx.putImageData(imageData, 0, 0);
  }, [canvasSize, getBuffers]);

  // Calculate attractor when parameters change or canvas is resized
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx?.clearRect(0, 0, canvas.width, canvas.height);

    let cancelCalculation: (() => void) | false | undefined;
    const timeout = setTimeout(() => {
      if (isReady && canvasRef.current) {
        cancelCalculation = calculateAttractor(
          {
            ...attractorParams,
            scale: attractorParams.scale * DEFAULT_SCALE,
          },
          {
            onProgress: (progressValue) => {
              // Update UI store progress
              setProgress(progressValue);
              // Update canvas as calculation progresses
              renderCanvas();
            },
            onComplete: (result) => {
              // Don't update if cancelled
              if (!result.cancelled) {
                // Set progress to completed in UI store
                setProgress(1);
                // Final render with complete calculation
                renderCanvas();
              }
            },
            onError: (err) => {
              console.error("Attractor calculation error:", err);
            },
          },
          {
            width: canvasSize.width,
            height: canvasSize.height,
            iterations: 1_000_000,
            totalItterations: 20_000_000,
            highQuality: true,
            // iterations: 100_000,
            // totalItterations: 100_000,
            // highQuality: false,
          },
        );
      }
    }, 333);

    // Return cleanup function to cancel calculation when parameters change
    return () => {
      if (typeof cancelCalculation === "function") {
        cancelCalculation();
      }
      if (timeout) clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isReady,
    attractorParams,
    canvasSize,
    // calculateAttractor,
    renderCanvas,
    setProgress,
  ]);

  return (
    <div
      className="absolute w-full h-full overflow-hidden"
      style={{ width: "100%", height: "100%" }}
    >
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="w-full h-full object-contain block"
        style={{ width: "100%", height: "100%" }}
      />

      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
          Loading WebAssembly module...
        </div>
      )}

      {error && (
        <div className="absolute bottom-4 left-4 right-4 bg-red-500 text-white p-2 rounded">
          Error: {error.message}
        </div>
      )}

      {isCalculating && (
        <div className="absolute bottom-4 left-4 right-4 bg-black/70 text-white p-2 rounded flex items-center">
          <div className="w-full bg-gray-700 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <span className="ml-2">{Math.round(progress * 100)}%</span>
        </div>
      )}

      {performanceRating && (
        <div className="absolute top-4 right-4 bg-black/70 text-white px-2 py-1 rounded text-xs">
          Performance: {performanceRating}/5
        </div>
      )}
    </div>
  );
}
