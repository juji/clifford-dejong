'use client';
import { useWorkerSupport } from "@/hooks/use-worker-support";
import dynamic from 'next/dynamic'
import { runAttractorBenchmark } from "@/lib/attractor-benchmark";
import { useUIStore } from "@/store/ui-store";
import { useEffect } from "react";

const PlainCanvas = dynamic(() => import('./plain-canvas').then(v => v.PlainCanvas), { ssr: false })
const WorkerCanvas = dynamic(() => import('./worker-canvas').then(v => v.WorkerCanvas), { ssr: false })
const SharedArrayCanvas = dynamic(() => import('./shared-array-canvas').then(v => v.SharedArrayCanvas), { ssr: false })
const OffscreenCanvas = dynamic(() => import('./offscreen-canvas').then(v => v.OffscreenCanvas), { ssr: false })

export function AttractorCanvasDynamic({ ariaLabel }: { ariaLabel?: string }) {
  const workerSupport = useWorkerSupport();
  const setBenchmarkResult = useUIStore(state => state.setBenchmarkResult);
  
  // Run the benchmark on component mount and store the result
  useEffect(() => {
    async function benchmark() {
      try {
        const result = await runAttractorBenchmark(100000, 3);
        setBenchmarkResult(result);
      } catch (error) {
        console.error('Benchmark failed:', error);
        console.error('Falling back to a slowed down benchmark result');
        setBenchmarkResult({ 
          points: 100000, runs: 3, 
          avgMs: 21.199999968210857, 
          msPer100k: 21.199999968210857
        });
      }
    }
    
    benchmark();
  }, [setBenchmarkResult]);

  console.log('workerSupport', workerSupport)

  return workerSupport === 'none' ? (
    <PlainCanvas ariaLabel={ariaLabel} />
  ) : workerSupport === 'worker' ? (
    <WorkerCanvas ariaLabel={ariaLabel} />
  ) : workerSupport === 'shared-array' ? (
    <SharedArrayCanvas ariaLabel={ariaLabel} />
  ) : workerSupport === 'offscreen' ? (
    <OffscreenCanvas ariaLabel={ariaLabel} />
  ) : null

}
