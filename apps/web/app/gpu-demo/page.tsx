"use client";

import { useEffect, useRef, useState } from "react";
import { GPU } from "gpu.js";
import { useAttractorStore } from "@repo/state/attractor-store";
import Link from "next/link";

interface PerformanceResult {
  computation: number;
  rendering: number;
  total: number;
}

export default function GPUDemoPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gpu, setGpu] = useState<GPU | null>(null);
  const [performanceResults, setPerformanceResults] =
    useState<PerformanceResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [browserSupport, setBrowserSupport] = useState<{
    webgl: boolean;
    webgl2: boolean;
    sharedArrayBuffer: boolean;
    offscreenCanvas: boolean;
    isSupported: boolean;
  } | null>(null);

  // Get attractor parameters from the store
  const { attractorParameters } = useAttractorStore();

  // Configuration
  const gpuThreadNum = 2_000_000;

  // Check browser capabilities for GPU.js
  const checkBrowserSupport = () => {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl");
    const gl2 = canvas.getContext("webgl2");

    const support = {
      webgl: !!gl,
      webgl2: !!gl2,
      sharedArrayBuffer: typeof SharedArrayBuffer !== "undefined",
      offscreenCanvas: typeof OffscreenCanvas !== "undefined",
      isSupported: false,
    };

    // GPU.js requires at least WebGL
    support.isSupported = support.webgl;

    setBrowserSupport(support);
    return support;
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const support = checkBrowserSupport();

      if (support.isSupported) {
        try {
          const gpuInstance = new GPU();
          setGpu(gpuInstance);
        } catch (error) {
          console.error("GPU.js initialization failed:", error);
          setBrowserSupport((prev) =>
            prev ? { ...prev, isSupported: false } : null,
          );
        }
      }
    }
  }, []);

  // Clifford attractor on GPU
  const renderAttractor = () => {
    if (!gpu || !canvasRef.current) return;

    const overallStart = window.performance.now();

    const canvas = canvasRef.current;
    const width = canvas.width;
    const height = canvas.height;

    // Use attractor parameters from the store
    const { a, b, c, d } = attractorParameters;

    const generatePoints = gpu
      .createKernel(function () {
        // Give each thread a slightly different starting point
        let x = (this.thread.x / this.output.x - 0.5) * 0.01;
        let y = (this.thread.x / this.output.x - 0.5) * 0.01;

        for (let i = 0; i < (this.constants.iterations as number); i++) {
          const newX =
            Math.sin((this.constants.a as number) * y) +
            (this.constants.c as number) *
              Math.cos((this.constants.a as number) * x);
          const newY =
            Math.sin((this.constants.b as number) * x) +
            (this.constants.d as number) *
              Math.cos((this.constants.b as number) * y);
          x = newX;
          y = newY;
        }

        return [x, y];
      })
      .setConstants({ a, b, c, d, iterations: 10000 })
      .setOutput([gpuThreadNum]);

    // Time the GPU computation
    const computationStart = window.performance.now();
    const points = generatePoints() as [number, number][];
    const computationTime = window.performance.now() - computationStart;

    // Time the rendering
    const renderStart = window.performance.now();
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = "rgba(0, 255, 255, 0.3)"; // Bright cyan color

      points.forEach(([x, y]) => {
        // Much more aggressive scaling - Clifford attractors need big scaling
        const scale = 60; // Large scale factor

        const px = width / 2 + x * scale;
        const py = height / 2 + y * scale;

        if (px >= 0 && px < width && py >= 0 && py < height) {
          ctx.fillRect(Math.floor(px), Math.floor(py), 1, 1);
        }
      });
    }
    const renderTime = window.performance.now() - renderStart;
    const totalTime = window.performance.now() - overallStart;

    setPerformanceResults({
      computation: computationTime,
      rendering: renderTime,
      total: totalTime,
    });
  };

  const runDemo = async () => {
    setIsRunning(true);
    renderAttractor();
    setIsRunning(false);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">GPU.js Clifford Attractor</h1>
        <Link
          href="/gpu-offscreen-demo"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
        >
          Try OffscreenCanvas + Worker Demo →
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-4">
          {/* Browser Support Check */}
          {browserSupport && !browserSupport.isSupported && (
            <div className="p-4 rounded border border-red-500 bg-red-50">
              <h3 className="font-medium text-red-800 mb-2">
                ⚠️ Browser Compatibility Issues
              </h3>
              <div className="text-sm text-red-700 space-y-1">
                <p className="font-medium">
                  Your browser doesn&apos;t support GPU.js requirements:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  {!browserSupport.webgl && <li>WebGL is not available</li>}
                  {!browserSupport.webgl2 && (
                    <li>WebGL2 is not available (optional but recommended)</li>
                  )}
                  {!browserSupport.sharedArrayBuffer && (
                    <li>SharedArrayBuffer is not available (optional)</li>
                  )}
                  {!browserSupport.offscreenCanvas && (
                    <li>OffscreenCanvas is not available (optional)</li>
                  )}
                </ul>
                <p className="mt-2 font-medium">
                  Please try a modern browser like Chrome, Firefox, or Safari.
                </p>
              </div>
            </div>
          )}

          {browserSupport && browserSupport.isSupported && (
            <div className="p-3 rounded border border-green-500 bg-green-50">
              <h3 className="font-medium text-green-800 mb-1">
                ✅ GPU.js Compatible
              </h3>
              <div className="text-xs text-green-700">
                WebGL: {browserSupport.webgl ? "✓" : "✗"} | WebGL2:{" "}
                {browserSupport.webgl2 ? "✓" : "✗"} | SharedArrayBuffer:{" "}
                {browserSupport.sharedArrayBuffer ? "✓" : "✗"}
              </div>
            </div>
          )}

          <button
            onClick={runDemo}
            disabled={isRunning || !gpu || !browserSupport?.isSupported}
            className="w-full p-3 rounded disabled:opacity-50"
          >
            {!browserSupport?.isSupported
              ? "Browser Not Supported"
              : isRunning
                ? "Generating..."
                : "Generate Attractor"}
          </button>

          {performanceResults && (
            <div className="p-4 rounded border">
              <h3 className="font-medium mb-3">⏱️ Performance Results:</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>GPU Computation:</span>
                  <span className="font-mono">
                    {performanceResults.computation.toFixed(2)}ms
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Canvas Rendering:</span>
                  <span className="font-mono">
                    {performanceResults.rendering.toFixed(2)}ms
                  </span>
                </div>
                <div className="flex justify-between font-medium border-t pt-2">
                  <span>Total Time:</span>
                  <span className="font-mono">
                    {performanceResults.total.toFixed(2)}ms
                  </span>
                </div>
                <div className="text-xs opacity-75 mt-2">
                  Generated {gpuThreadNum.toLocaleString()} points
                </div>
              </div>
            </div>
          )}

          <div className="text-sm">
            <h3 className="font-medium mb-2">About Clifford Attractors:</h3>
            <p>
              The Clifford attractor is a type of strange attractor discovered
              by Clifford Pickover. It generates beautiful, chaotic patterns
              using the equations:
            </p>
            <div className="mt-2 font-mono text-xs">
              <p>x₁ = sin(a × y) + c × cos(a × x)</p>
              <p>y₁ = sin(b × x) + d × cos(b × y)</p>
            </div>
            <div className="mt-3 p-2 border rounded">
              <h4 className="font-medium text-xs mb-2">Current Parameters:</h4>
              <div className="grid grid-cols-2 gap-1 text-xs font-mono">
                <span>a: {attractorParameters.a}</span>
                <span>b: {attractorParameters.b}</span>
                <span>c: {attractorParameters.c}</span>
                <span>d: {attractorParameters.d}</span>
              </div>
              <div className="mt-2 text-xs">
                <span>Scale: {attractorParameters.scale}</span>
              </div>
            </div>
            <p className="mt-2">
              This GPU.js implementation generates{" "}
              {gpuThreadNum.toLocaleString()} points in parallel for smooth
              visualization.
            </p>
          </div>
        </div>

        {/* Canvas */}
        <div>
          <canvas
            ref={canvasRef}
            width={400}
            height={400}
            className="border w-full max-w-md"
            style={{ imageRendering: "pixelated" }}
          />
        </div>
      </div>

      <div className="mt-8 p-4 rounded">
        <h3 className="font-medium mb-2">GPU.js Features Demonstrated:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Parallel computation acceleration</li>
          <li>Mathematical visualization</li>
          <li>Strange attractor simulation</li>
          <li>Canvas rendering integration</li>
        </ul>
      </div>
    </div>
  );
}
