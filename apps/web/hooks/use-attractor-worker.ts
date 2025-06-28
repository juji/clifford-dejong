import { useEffect, useRef } from "react";

interface AttractorWorkerOptions {
  onMessage: (e: MessageEvent) => void;
}

export function useAttractorWorker({ onMessage }: AttractorWorkerOptions) {
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    const worker = new Worker(
      new URL("../workers/attractor-worker.ts", import.meta.url),
      { type: "module" },
    );
    workerRef.current = worker;
    worker.onmessage = onMessage;
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return workerRef;
}
