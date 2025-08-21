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
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState(0);
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

  // Store results for all stages in a timeline array
  const [stageTimeline, setStageTimeline] = useState<
    Array<{
      stage: number;
      pointsTime: number;
      densityTime: number;
      imageTime: number;
      totalTime: number;
      accumulatedTime?: number; // Track accumulated time across stages
      pointsPerSecond: string;
      accumulatedPoints: number;
      progress: number;
    }>
  >([]);

  // Define the points for each stage - accessible throughout the component
  // prettier-ignore
  const stagePoints = [
    5_000_000, 
    5_000_000, 
    5_000_000, 
    5_000_000
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create worker
    const worker = new Worker("/workers/progressive-gpu-worker.js");
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

          // Use the stagePoints defined at component level

          // Run the Clifford calculation with canvas dimensions and transfer the canvas
          worker.postMessage(
            {
              type: "runClifford",
              canvas: offscreenCanvas,
              stagePoints: stagePoints, // Pass the points for each stage
              params: {
                width: window.innerWidth,
                height: window.innerHeight,
                scale: 150,
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
      } else if (data.type === "progress") {
        // Handle progressive rendering progress updates
        setStage(data.stage);
        setProgress(data.progress);

        const stagePercent = Math.round(data.progress * 100);
        const pointsInMillions = (data.accumulatedPoints / 1000000).toFixed(1);
        const totalStages = stagePoints.length;

        setStatus(
          `Stage ${data.stage}/${totalStages} (${stagePercent}%): ${pointsInMillions}M points processed`,
        );

        // Store results for this stage in timeline
        setStageTimeline((prevTimeline) => {
          // Calculate accumulated time from previous stages
          let accumulatedTime = 0;
          if (prevTimeline && prevTimeline.length > 0) {
            // Find the highest stage below current one
            const prevStages = prevTimeline.filter(
              (entry) => entry.stage < data.stage,
            );
            if (prevStages.length > 0) {
              // Sort stages by stage number (descending)
              const sortedPrevStages = [...prevStages].sort(
                (a, b) => b.stage - a.stage,
              );
              // Take the highest stage number (first after sorting)
              const lastPrevStage = sortedPrevStages[0];

              // Use accumulated time if available, otherwise use total time
              if (lastPrevStage) {
                accumulatedTime =
                  lastPrevStage.accumulatedTime !== undefined
                    ? lastPrevStage.accumulatedTime
                    : lastPrevStage.totalTime;
              }
            }
          }

          // Create new stage entry
          const newStageEntry = {
            stage: data.stage,
            pointsTime: data.pointsTime,
            densityTime: data.densityTime,
            imageTime: data.imageTime || 0,
            totalTime: data.totalTime,
            accumulatedTime: accumulatedTime + data.totalTime, // Add current stage time
            pointsPerSecond: data.pointsPerSecond,
            accumulatedPoints: data.accumulatedPoints,
            progress: data.progress,
          };

          // If we already have an entry for this stage, replace it
          // otherwise add the new entry
          const filteredTimeline = prevTimeline
            ? prevTimeline.filter((entry) => entry.stage !== data.stage)
            : [];

          return [...filteredTimeline, newStageEntry].sort(
            (a, b) => a.stage - b.stage,
          ); // Keep sorted by stage
        });

        // Update the current results with current data
        setResults({
          pointsTime: data.pointsTime,
          densityTime: data.densityTime,
          imageTime: data.imageTime || 0,
          totalTime: data.totalTime,
          pointsPerSecond: data.pointsPerSecond,
          gpuMode: data.gpuMode,
          pointSamples: [],
          densitySamples: [],
        });
      } else if (data.type === "result") {
        const canvasStatus = data.drawnToCanvas
          ? `Image drawn directly to canvas in ${data.drawTime ? data.drawTime.toFixed(2) : "?"}ms`
          : "Image data returned to main thread";

        setStage(3);
        setProgress(1.0);
        setStatus(`Calculation complete. ${canvasStatus}`);
        const totalPointsInMillions =
          (data.totalPoints ||
            stagePoints.reduce((sum, points) => sum + points, 0)) / 1000000;
        console.log(
          `Calculated ${totalPointsInMillions.toFixed(1)} million points in ${data.totalTime.toFixed(2)}ms`,
        );
        console.log(`Points calculation: ${data.pointsTime.toFixed(2)}ms`);
        console.log(`Density calculation: ${data.densityTime.toFixed(2)}ms`);
        console.log(`Performance: ${data.pointsPerSecond} points/second`);

        // Ensure we have the final stage in our timeline
        setStageTimeline((prevTimeline) => {
          // Calculate accumulated time from previous stages
          let accumulatedTime = 0;
          if (prevTimeline && prevTimeline.length > 0) {
            // Find the highest stage below the final stage
            const prevStages = prevTimeline.filter(
              (entry) => entry.stage < stagePoints.length,
            );
            if (prevStages.length > 0) {
              // Sort stages by stage number (descending)
              const sortedPrevStages = [...prevStages].sort(
                (a, b) => b.stage - a.stage,
              );
              // Take the highest stage number (first after sorting)
              const lastPrevStage = sortedPrevStages[0];

              // Use accumulated time if available, otherwise use total time
              if (lastPrevStage) {
                accumulatedTime =
                  lastPrevStage.accumulatedTime !== undefined
                    ? lastPrevStage.accumulatedTime
                    : lastPrevStage.totalTime;
              }
            }
          }

          // Final stage data
          const finalStageEntry = {
            stage: stagePoints.length,
            pointsTime: data.pointsTime,
            densityTime: data.densityTime,
            imageTime: data.imageTime || 0,
            totalTime: data.totalTime,
            accumulatedTime: accumulatedTime + data.totalTime, // Add final stage time
            pointsPerSecond: data.pointsPerSecond,
            accumulatedPoints:
              data.totalPoints ||
              stagePoints.reduce((sum, points) => sum + points, 0),
            progress: 1.0,
          };

          // If we already have an entry for this stage, replace it
          const filteredTimeline = prevTimeline
            ? prevTimeline.filter((entry) => entry.stage !== stagePoints.length)
            : [];

          return [...filteredTimeline, finalStageEntry].sort(
            (a, b) => a.stage - b.stage,
          ); // Keep sorted by stage
        });

        // Store final results for display
        setResults({
          pointsTime: data.pointsTime,
          densityTime: data.densityTime,
          imageTime: data.imageTime || 0,
          totalTime: data.totalTime,
          pointsPerSecond: data.pointsPerSecond,
          gpuMode: data.gpuMode,
          pointSamples: [],
          densitySamples: [],
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
          width: "300px",
        }}
      >
        <div style={{ marginBottom: "8px" }}>GPU.js Attractor • {status}</div>

        {/* Progress bar */}
        {stage > 0 && (
          <div style={{ width: "100%" }}>
            <div
              style={{
                height: "6px",
                width: "100%",
                backgroundColor: "rgba(255,255,255,0.2)",
                borderRadius: "3px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${progress * 100}%`,
                  backgroundColor: [
                    "#4CAF50",
                    "#2196F3",
                    "#9C27B0",
                    "#FF9800",
                    "#795548",
                    "#607D8B",
                  ][(stage - 1) % 6],
                  transition: "width 0.3s ease-out",
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Results overlay */}
      {results && (
        <div
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            color: "white",
            background: "rgba(0, 0, 0, 0.7)",
            padding: "12px",
            borderRadius: "4px",
            fontSize: "14px",
            fontFamily: "monospace",
            zIndex: 100,
            maxWidth: "360px",
            height: "100%",
            overflowY: "auto",
          }}
        >
          <h2 style={{ margin: "0 0 10px 0", fontSize: "16px" }}>
            Performance Timeline
          </h2>

          {/* Show all completed stages in timeline */}
          {stageTimeline && stageTimeline.length > 0 && (
            <>
              {stageTimeline.map((stageData) => {
                const stagePercent = Math.round(stageData.progress * 100);
                const stageText = `Stage ${stageData.stage} (${stagePercent}%)`;
                const pointsInMillions = (
                  stageData.accumulatedPoints / 1000000
                ).toFixed(1);
                // Create a dynamic color based on stage number
                const colorMap = [
                  "#4CAF50",
                  "#2196F3",
                  "#9C27B0",
                  "#FF9800",
                  "#795548",
                  "#607D8B",
                ];
                const stageColor =
                  colorMap[(stageData.stage - 1) % colorMap.length];

                return (
                  <div
                    key={`stage-${stageData.stage}`}
                    style={{
                      marginBottom: "16px",
                      padding: "8px",
                      borderLeft: `3px solid ${stageColor}`,
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                    }}
                  >
                    <h3
                      style={{
                        margin: "0 0 8px 0",
                        fontSize: "15px",
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <span>{stageText}</span>
                      <span>{pointsInMillions}M points</span>
                    </h3>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "140px 100px",
                        gap: "3px",
                        fontSize: "12px",
                      }}
                    >
                      <div>Points calculation:</div>
                      <div style={{ textAlign: "right" }}>
                        {stageData.pointsTime.toFixed(2)}ms
                      </div>

                      <div>Density mapping:</div>
                      <div style={{ textAlign: "right" }}>
                        {stageData.densityTime.toFixed(2)}ms
                      </div>

                      <div>Image creation:</div>
                      <div style={{ textAlign: "right" }}>
                        {stageData.imageTime.toFixed(2)}ms
                      </div>

                      <div>Stage time:</div>
                      <div style={{ textAlign: "right" }}>
                        {stageData.totalTime.toFixed(2)}ms
                      </div>

                      <div
                        style={{
                          borderTop: "1px solid rgba(255,255,255,0.2)",
                          paddingTop: "3px",
                        }}
                      >
                        Accumulated time:
                      </div>
                      <div
                        style={{
                          borderTop: "1px solid rgba(255,255,255,0.2)",
                          paddingTop: "3px",
                          textAlign: "right",
                          fontWeight: "bold",
                        }}
                      >
                        {(
                          stageData.accumulatedTime || stageData.totalTime
                        ).toFixed(2)}
                        ms
                      </div>

                      <div>Points/second:</div>
                      <div style={{ textAlign: "right" }}>
                        {stageData.pointsPerSecond}
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* Current execution status */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "140px 100px",
              gap: "4px",
              marginTop: "12px",
              borderTop: "1px solid rgba(255,255,255,0.3)",
              paddingTop: "12px",
            }}
          >
            <div>Current stage:</div>
            <div style={{ textAlign: "right" }}>
              {stage}/{stagePoints.length}
            </div>

            <div>Completion:</div>
            <div style={{ textAlign: "right" }}>
              {Math.round(progress * 100)}%
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
