import { useEffect, useRef, useState } from "react";

interface AttractorWorkerOptions {
  onStop?: (e: MessageEvent) => void;
  onPreview: (progress: number, e: MessageEvent) => void;
  onDone: (progress: number, e: MessageEvent) => void;
  onError: (err: string) => void;
  onLoadError: (err: string) => void;
  onReady: (e: MessageEvent) => void;
}

export function useAttractorWorker({
  onStop,
  onPreview,
  onDone,
  onError,
  onLoadError,
  onReady
}: AttractorWorkerOptions) {

  const workerRef = useRef<Worker | null>(null);
  const [ workerLoaded, setWorkerLoaded ] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      if(!workerLoaded){
        onLoadError('Worker not loaded');
      }
    },1000)
  }, []); 

  function onMessage(e: MessageEvent) {

    if (!workerRef.current) {
      throw new Error("Worker reference is null");  
    }

    if (e.data.type === "ready") {
      setWorkerLoaded(true)
      onReady(e);
    }

    if (e.data.type === "stopped") {
      onStop && onStop(e);
    }

    if (e.data.type === "preview") {
      onPreview(e.data.progress, e);
    }

    if (e.data.type === "done") {
      onDone(e.data.progress, e);
    }

    if(e.data.type === "error") {
      onError(e.data.error);
    }
  }

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
