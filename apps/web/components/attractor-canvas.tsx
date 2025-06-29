"use client";
import { useEffect, useRef, useState } from "react";
import { getColorData } from "@repo/core/color";
import { runAttractorBenchmark } from "../lib/attractor-benchmark";
import { useAttractorStore } from "../../../packages/state/attractor-store";
import { useUIStore } from "../store/ui-store";
import { useAttractorWorker } from "../hooks/use-attractor-worker";

function ModeToggleButton({
  mode,
  onToggle,
}: {
  mode: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className="fixed bottom-6 right-6 z-[201] px-4 py-2 rounded bg-background border border-foreground shadow text-foreground text-xs font-semibold hover:bg-foreground hover:text-background transition-colors"
      onClick={onToggle}
      aria-label="Toggle quality mode"
    >
      {mode === "high" ? "Low Quality" : "High Quality"}
    </button>
  );
}

export function AttractorCanvas() {
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Zustand selectors for all attractor state
  const attractorParameters = useAttractorStore((s) => s.attractorParameters);
  const setProgress = useAttractorStore((s) => s.setProgress);
  const setImageUrl = useAttractorStore((s) => s.setImageUrl);
  const setError = useAttractorStore((s) => s.setError);
  const DEFAULT_POINTS = useAttractorStore((s) => s.DEFAULT_POINTS);
  const DEFAULT_SCALE = useAttractorStore((s) => s.DEFAULT_SCALE);
  // const LOW_QUALITY_POINTS = useAttractorStore((s) => s.LOW_QUALITY_POINTS);
  const LOW_QUALITY_INTERVAL = useAttractorStore((s) => s.LOW_QUALITY_INTERVAL);

  // State for rendering
  const [canvasSize, setCanvasSize] = useState<{ width: number; height: number } | null>(null);
  const [canvasVisible, setCanvasVisible] = useState(true);
  
  //
  // initialization factors
  const [ initialized, setInitialized ] = useState(false);
  const offscreenSupported = useRef(typeof window !== 'undefined' && typeof window.OffscreenCanvas !== 'undefined');
  const offscreenTransferredRef = useRef(false);
  const [dynamicProgressInterval, setDynamicProgressInterval] = useState<number | null>(null);
  const dynamicProgressIntervalRef = useRef<number | null>(null);
  const [workerReady, setWorkerReady] = useState(false);

  // initialize
  useEffect(() => {

    // run benchmark on first render
    const result = runAttractorBenchmark();
    let interval;
    if (result.msPer100k < 10)
      interval = 0.5;
    else if (result.msPer100k < 30)
      interval = 1;
    else interval = 2.5;
    dynamicProgressIntervalRef.current = interval
    setDynamicProgressInterval(interval);

    // set default canvas size
    const canvas = canvasRef.current;
    if (canvas) {
      const parent = canvas.parentElement;
      if (parent) {
        const width = parent.clientWidth;
        const height = parent.clientHeight;
        canvas.width = width;
        canvas.height = height;
        setCanvasSize({ width, height });
      }
    }
  }, []);

  // set initialized state
  // when dynamicProgressInterval is set and canvasSize is available
  // and worker is ready
  useEffect(() => {
    if (
      dynamicProgressInterval && 
      canvasSize &&
      workerReady
    ) {
      setInitialized(true);
    }
  }, [dynamicProgressInterval, canvasSize, workerReady]);

  // Use custom worker hook
  const workerRef = useAttractorWorker({
    onReady: () => {
      setWorkerReady(true);
    },
    onLoadError: (error: string) => {
      setError(error || "Worker failed to load");
    },
    onPreview: ( progress, e ) => {

      setProgress(progress);

      if(e.data.pixels && e.data.pixels.length > 0) {
        mainThreadDrawing(e.data.pixels, e.data.maxDensity, progress);
      }

    },
    onDone: ( progress, e ) => {

      setProgress(progress);

      if(e.data.pixels && e.data.pixels.length > 0) {
        mainThreadDrawing(e.data.pixels, e.data.maxDensity, progress);
      }

      // Optionally, you can get image data from the canvas if needed
      const canvas = canvasRef.current;
      if (canvas) setImageUrl(canvas.toDataURL("image/png"));
    },
    onError: (error: string) => {
      setError(error || "Unknown error in worker");
    },
  });

  // qualityMode
  // should be set automatically
  // based on params changes
  // this is an initial setup
  const qualityMode = useUIStore((s) => s.qualityMode);
  const setQualityMode = useUIStore((s) => s.setQualityMode);
  useEffect(() => {

    // on low quality mode change
    if (qualityMode === 'low') {

      // stop the worker if it exists
      if (workerRef.current) {
        workerRef.current.postMessage({ type: "stop" });
      }

      setDynamicProgressInterval(LOW_QUALITY_INTERVAL);

    }else{
      setDynamicProgressInterval(dynamicProgressIntervalRef.current);
    }

  }, [qualityMode, LOW_QUALITY_INTERVAL, workerRef]);

  // 
  function mainThreadDrawing(
    pixels: number[], 
    maxDensity: number, 
    progress: number
  ) {

    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const width = canvas.width;
    const height = canvas.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const imageData = ctx.createImageData(width, height);
    const data = new Uint32Array(imageData.data.buffer);
    const bgArr = attractorParameters.background;
    
    const bgColor =
      (bgArr[3] << 24) | (bgArr[2] << 16) | (bgArr[1] << 8) | bgArr[0];
    
    if (qualityMode === 'low') {

      for (let i = 0; i < pixels.length; i++) {
        data[i] = (pixels[i] ?? 0) > 0 ? 0xffffffff : bgColor;
      }

    } else {

      for (let i = 0; i < pixels.length; i++) {
        const density = pixels[i] ?? 0;
        if (density > 0) {
          data[i] = getColorData(
            density,
            maxDensity,
            attractorParameters.hue ?? 120,
            attractorParameters.saturation ?? 100,
            attractorParameters.brightness ?? 100,
            progress > 0 ? progress / 100 : 1,
          );
        } else {
          data[i] = bgColor;
        }
      }

    }
    ctx.putImageData(imageData, 0, 0);
  }

  // Listen for window resize and update canvas size state
  useEffect(() => {

    let lastSize = { width: 0, height: 0 };
    const HEIGHT_THRESHOLD = 40; // px, ignore small height changes (e.g. mobile scroll)

    let resizeTimeout: ReturnType<typeof setTimeout> | null = null;
    function updateSize() {
      
      if(canvasVisible) {
        setCanvasVisible(false);
      }

      // stop calculation immediately
      if (workerRef.current) workerRef.current.postMessage({ type: "stop" });
      if(resizeTimeout) clearTimeout(resizeTimeout);
      
      resizeTimeout = setTimeout(() => {
        const canvas = canvasRef.current;
        const parent = canvas?.parentElement;
        if (!(canvas && parent)) return;

        const newSize = {
          width: parent.clientWidth,
          height: parent.clientHeight,
        };

        const heightDelta = Math.abs(newSize.height - lastSize.height);
        if (newSize.width !== lastSize.width || heightDelta > HEIGHT_THRESHOLD) {
          lastSize = newSize;
          setCanvasSize(newSize);
          setTimeout(() => { setCanvasVisible(true); },100)
        }
      }, 500);
    }

    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const workerInitiated = useRef(false);
  function initiateWorker() {

    // initiate everything
    setImageUrl(null);
    setError(null);
    setProgress(0);

    // sanity checks
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    if(!canvasSize) return;
    if(!workerRef.current) return;

    const width = canvasSize.width;
    const height = canvasSize.height;

    // setup canvas size
    // before OffscreenCanvas transfer
    if(!offscreenTransferredRef.current) {
      canvas.width = width;
      canvas.height = height;
    }

    // initialize offscreen canvas
    if (offscreenSupported && !offscreenTransferredRef.current) {
      
      const offscreen = canvas.transferControlToOffscreen();
      workerRef.current.postMessage({
        type: "init",
        canvas: offscreen,
        width,
        height,
        params: attractorParameters,
        progressInterval: dynamicProgressInterval,
        points: DEFAULT_POINTS,
        defaultScale: DEFAULT_SCALE,
      }, [offscreen]);
      offscreenTransferredRef.current = true;

    }else{

      workerRef.current.postMessage({
        type: "init",
        width,
        height,
        params: attractorParameters,
        progressInterval: dynamicProgressInterval,
        points: DEFAULT_POINTS,
        defaultScale: DEFAULT_SCALE,
      });

    }

  }

  // when canvas size changes
  useEffect(() => {
    if(!workerInitiated.current) return;
    if(!canvasSize) return;
    workerRef.current?.postMessage({
      type: 'resize',
      width: canvasSize?.width,
      height: canvasSize?.height,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasSize]);

  // canvas visibility change
  useEffect(() => {
    if(!workerInitiated.current) return;
    if (canvasVisible) {
      workerRef.current?.postMessage({
        type: 'start',
      })
    } else {
      workerRef.current?.postMessage({
        type: 'stop',
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasVisible]);

  // after initialized
  // or attractor parameters change
  useEffect(() => {
    
    if(!initialized) return;
    else if(!workerInitiated.current) {
      initiateWorker()
      workerInitiated.current = true
    }
    else workerRef.current?.postMessage({
      type: 'calculate',
      params: attractorParameters
    })
    
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ initialized, attractorParameters ]);


  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          maxWidth: '100%',
          maxHeight: '100%',
          opacity: canvasVisible ? 1 : 0,
          transition: 'opacity 300ms',
        }}
      />
      <ModeToggleButton mode={qualityMode} onToggle={() => setQualityMode(qualityMode === 'high' ? 'low' : 'high')} />
    </div>
  );
}
