import { useEffect } from "react";
import { useWorkerSupport } from "./use-worker-support";

interface AttractorWorkerOptions {
  canvas: HTMLCanvasElement
}

export function useAttractorWorker({
  canvas,
}: AttractorWorkerOptions) {

  const workerSupport = useWorkerSupport();


  useEffect(() => {
    // if (!canvas) return;
    console.log('canvas', canvas)
    console.log('workerSupport', workerSupport)
  },[canvas, workerSupport])

  return {};
}
