// Simple performance benchmark for attractor calculation
// Usage: import and call runAttractorBenchmark() to get ms per 100k points
import { clifford } from "@repo/core";

export interface AttractorBenchmarkResult {
  points: number;
  runs: number;
  avgMs: number;
  msPer100k: number;
}

export async function runAttractorBenchmark(points = 100000, runs = 5): Promise<AttractorBenchmarkResult> {
  let totalMs = 0;
  for (let run = 0; run < runs; run++) {
    let x = 0,
      y = 0;
    const a = 2,
      b = -2,
      c = 1,
      d = -1;
    const start = performance.now();
    for (let i = 0; i < points; i++) {
      const result = clifford(x, y, a, b, c, d);
      x =
        Array.isArray(result) && typeof result[0] === "number" ? result[0] : 0;
      y =
        Array.isArray(result) && typeof result[1] === "number" ? result[1] : 0;
    }
    const end = performance.now();
    totalMs += end - start;
  }
  const avgMs = totalMs / runs;
  return {
    points,
    runs,
    avgMs,
    msPer100k: (avgMs / points) * 100000,
  };
}
