"use client";

import { useEffect, useRef, useState } from "react";

// Global styles to ensure full viewport canvas
const globalStyles = `
html, body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  width: 100%;
  height: 100%;
  background: black;
}
`;

export default function GpuExperiment() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState("Initializing...");
  const [canvasTransferred, setCanvasTransferred] = useState(false);
  const [results, setResults] = useState<{
    pointsTime: number;
    densityTime: number;
    imageTime: number;
    totalTime: number;
    pointsPerSecond: string;
    gpuMode: boolean;
    pointSamples: Array<{ pos: [number, number]; value: [number, number] }>;
    densitySamples: Array<{ pos: [number, number]; value: number }>;
  } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create worker
    const worker = new Worker("/workers/gpu-attractor-worker.js");
    workerRef.current = worker;

    // Handle window resize events - only notify worker after canvas is transferred
    const handleResize = () => {
      if (canvasTransferred && workerRef.current) {
        workerRef.current.postMessage({
          type: "resize",
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    // Handle messages from worker
    worker.onmessage = (e) => {
      const data = e.data;

      if (data.type === "ready") {
        setStatus("Worker ready, initializing GPU...");
        worker.postMessage({ type: "init" });
      } else if (data.type === "init") {
        const mode = data.gpuMode ? "GPU" : "CPU";
        setStatus(
          `Worker initialized in ${mode} mode. Running Clifford calculation...`,
        );

        try {
          // Get an offscreen canvas that can be transferred to the worker
          const offscreenCanvas = canvas.transferControlToOffscreen();

          // Run the Clifford calculation with canvas dimensions and transfer the canvas
          worker.postMessage(
            {
              type: "runClifford",
              canvas: offscreenCanvas,
              params: {
                width: window.innerWidth,
                height: window.innerHeight,
                scale: 100,
                iterations: 100,
                a: 2,
                b: -2,
                c: 1,
                d: -1,
                attractor: "clifford",
                hue: 333,
                saturation: 100,
                brightness: 100,
                background: [0, 0, 0, 255],
                left: 0,
                top: 0,
              },
            },
            [offscreenCanvas],
          ); // Include canvas in transfer list

          // Set the transferred state AFTER the message is sent
          setCanvasTransferred(true);
          setStatus(
            `Canvas transferred to worker. Running Clifford calculation...`,
          );
        } catch (error) {
          console.error("Failed to transfer canvas:", error);
          setStatus(
            `Error: Failed to transfer canvas. ${error instanceof Error ? error.message : "Unknown error"}`,
          );
          throw new Error(
            `Canvas transfer failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
        }
      } else if (data.type === "cliffordResult") {
        const canvasStatus = data.drawnToCanvas
          ? `Image drawn directly to canvas in ${data.drawTime.toFixed(2)}ms`
          : "Image data returned to main thread";

        setStatus(`Calculation complete. ${canvasStatus}`);
        console.log(
          `Calculated 20 million points in ${data.totalTime.toFixed(2)}ms`,
        );
        console.log(`Points calculation: ${data.pointsTime.toFixed(2)}ms`);
        console.log(`Density calculation: ${data.densityTime.toFixed(2)}ms`);
        console.log(`Performance: ${data.pointsPerSecond} points/second`);
        console.log("Point samples:", data.pointSamples);
        console.log("Density samples:", data.densitySamples);

        // Since we always transfer the canvas, we don't need to handle drawing in the main thread
        // The image should always be drawn directly in the worker

        // Store results for display
        setResults({
          pointsTime: data.pointsTime,
          densityTime: data.densityTime,
          imageTime: data.imageTime || 0, // Add imageTime with fallback
          totalTime: data.totalTime,
          pointsPerSecond: data.pointsPerSecond,
          gpuMode: data.gpuMode,
          pointSamples: data.pointSamples,
          densitySamples: data.densitySamples,
        });
      } else if (data.type === "error") {
        setStatus(`Calculation error: ${data.message}`);
        console.error("Worker error:", data.message);
      }
    };

    // Handle errors
    worker.onerror = (e) => {
      setStatus(`Worker error: ${e.message}`);
    };

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      worker.terminate();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reference to store worker instance
  const workerRef = useRef<Worker | null>(null);

  // Effect to handle initial canvas sizing
  useEffect(() => {
    // Size the canvas only once at the beginning
    if (canvasRef.current && !canvasTransferred) {
      canvasRef.current.width = window.innerWidth;
      canvasRef.current.height = window.innerHeight;
    }
  }, [canvasTransferred]);

  return (
    <div
      style={{
        padding: 0,
        margin: 0,
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          display: "block",
        }}
      />

      {/* Status overlay */}
      <div
        style={{
          position: "fixed",
          top: 10,
          left: 10,
          color: "white",
          background: "rgba(0, 0, 0, 0.7)",
          padding: "8px 12px",
          borderRadius: "4px",
          fontSize: "14px",
          fontFamily: "monospace",
          zIndex: 100,
        }}
      >
        GPU.js Attractor • {status}
      </div>

      {/* Results overlay */}
      {results && (
        <div
          style={{
            position: "fixed",
            top: 50,
            right: 10,
            color: "white",
            background: "rgba(0, 0, 0, 0.7)",
            padding: "12px",
            borderRadius: "4px",
            fontSize: "14px",
            fontFamily: "monospace",
            zIndex: 100,
          }}
        >
          <h2 style={{ margin: "0 0 10px 0", fontSize: "16px" }}>
            Performance
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "140px 100px",
              gap: "4px",
            }}
          >
            <div>Points calculation:</div>
            <div style={{ textAlign: "right" }}>
              {results.pointsTime.toFixed(2)}ms
            </div>

            <div>Density mapping:</div>
            <div style={{ textAlign: "right" }}>
              {results.densityTime.toFixed(2)}ms
            </div>

            <div>Image creation:</div>
            <div style={{ textAlign: "right" }}>
              {results.imageTime.toFixed(2)}ms
            </div>

            <div
              style={{
                borderTop: "1px solid rgba(255,255,255,0.2)",
                paddingTop: "4px",
                marginTop: "2px",
              }}
            >
              Total time:
            </div>
            <div
              style={{
                borderTop: "1px solid rgba(255,255,255,0.2)",
                paddingTop: "4px",
                marginTop: "2px",
                textAlign: "right",
                fontWeight: "bold",
              }}
            >
              {results.totalTime.toFixed(2)}ms
            </div>

            <div style={{ marginTop: "8px" }}>Points/second:</div>
            <div style={{ marginTop: "8px", textAlign: "right" }}>
              {results.pointsPerSecond}
            </div>

            <div>Mode:</div>
            <div style={{ textAlign: "right" }}>
              {results.gpuMode ? "GPU" : "CPU"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
