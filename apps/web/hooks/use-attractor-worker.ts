import { useCallback, useEffect, useRef, useState } from 'react';
import type { AttractorParameters } from '@repo/core/types';

// Types for the hook
interface AttractorWorkerParams extends AttractorParameters {
  // Additional rendering parameters not in the core type
  iterations: number;
  startX: number;
  startY: number;
  width: number;
  height: number;
  // Note: Using 'left' and 'top' from AttractorParameters instead of offsetX/Y
}

interface AttractorResult {
  pointsX: Float32Array;
  pointsY: Float32Array;
  pointCount: number;
  duration: number;
  width: number;
  height: number;
  // Using standard AttractorParameters properties
  scale: number;
  left: number;  // Instead of offsetX
  top: number;   // Instead of offsetY
  metadata: {
    attractor: AttractorParameters['attractor'];
    params: Pick<AttractorParameters, 'a' | 'b' | 'c' | 'd'>;
  };
}

interface AttractorCallbacks {
  onResult?: (result: AttractorResult) => void;
  onError?: (error: any) => void;
  onBusy?: () => void;
}

interface WorkerError {
  message?: string;
  error?: string;
  type?: 'initialization' | 'calculation' | 'performance' | 'worker';
  details?: Record<string, unknown>;
}

/**
 * Hook to interact with the WebAssembly attractor calculator worker
 * This hook provides a way to calculate attractor points using the WebAssembly module
 * in a separate thread via a Web Worker.
 * 
 * @returns {Object} Methods and state for working with the attractor calculator
 */
export function useAttractorWorker() {
  const [isReady, setIsReady] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [performanceRating, setPerformanceRating] = useState<number | null>(null);
  
  const workerRef = useRef<Worker | null>(null);
  const callbacksRef = useRef<AttractorCallbacks>({});

  // Initialize the worker
  useEffect(() => {
    // Create the worker
    const worker = new Worker('/wasm/worker.js', { type: 'module' });
    
    // Set up message handling
    worker.onmessage = (e) => {
      const { type, ...data } = e.data;
      
      switch (type) {
        case 'ready':
          // Worker script has loaded, initialize the WebAssembly module
          worker.postMessage({ type: 'init' });
          break;
          
        case 'initialized':
          setIsReady(true);
          // Run a performance test when initialized
          worker.postMessage({ type: 'performance-test' });
          break;
          
        case 'result':
          setIsCalculating(false);
          if (callbacksRef.current.onResult) {
            callbacksRef.current.onResult(data);
          }
          break;
          
        case 'performance-result':
          setPerformanceRating(data.rating);
          break;
          
        case 'busy':
          if (callbacksRef.current.onBusy) {
            callbacksRef.current.onBusy();
          }
          break;
          
        case 'error':
          setIsCalculating(false);
          setError(new Error(data.message || 'Unknown error'));
          if (callbacksRef.current.onError) {
            callbacksRef.current.onError(data);
          }
          break;
          
        default:
          console.warn('Unknown message from worker:', e.data);
      }
    };
    
    // Handle worker errors
    worker.onerror = (errorEvent) => {
      const errorObj = new Error(errorEvent.message || 'Worker error');
      setError(errorObj);
      setIsCalculating(false);
      if (callbacksRef.current.onError) {
        callbacksRef.current.onError({ message: errorEvent.message, error: errorObj.toString() });
      }
    };
    
    // Save the worker reference
    workerRef.current = worker;
    
    // Clean up on unmount
    return () => {
      if (worker) {
        worker.postMessage({ type: 'terminate' });
        worker.terminate();
      }
    };
  }, []);
  
  /**
   * Helper to convert AttractorParameters to the format expected by the WebAssembly module
   */
  const prepareWorkerParams = useCallback((baseParams: AttractorParameters, renderParams: Partial<AttractorWorkerParams> = {}) => {
    return {
      // Use all core parameters
      ...baseParams,
      // Add default rendering parameters
      iterations: 1000000,
      startX: 0,
      startY: 0,
      width: 800,
      height: 800,
      // Override with any provided render params
      ...renderParams
    } as AttractorWorkerParams;
  }, []);

  /**
   * Calculate attractor points using the WebAssembly module via the worker
   */
  const calculateAttractor = useCallback((
    params: AttractorWorkerParams | AttractorParameters, 
    renderParamsOrCallbacks?: Partial<AttractorWorkerParams> | AttractorCallbacks,
    maybeCallbacks?: AttractorCallbacks
  ) => {
    // Handle the different parameter configurations
    let renderParams: Partial<AttractorWorkerParams> | undefined;
    let callbacks: AttractorCallbacks = {};
    
    // Type guards
    function isCallbacks(obj: any): obj is AttractorCallbacks {
      return obj && (
        'onResult' in obj || 
        'onError' in obj || 
        'onBusy' in obj
      );
    }
    
    if (renderParamsOrCallbacks) {
      if (isCallbacks(renderParamsOrCallbacks)) {
        // The second parameter is actually callbacks
        callbacks = renderParamsOrCallbacks;
      } else {
        // The second parameter is render params
        renderParams = renderParamsOrCallbacks as Partial<AttractorWorkerParams>;
        if (maybeCallbacks) {
          callbacks = maybeCallbacks;
        }
      }
    }
    if (!workerRef.current || !isReady) {
      const error = new Error('WebAssembly worker not initialized');
      setError(error);
      if (callbacks.onError) {
        callbacks.onError({ message: error.message, type: 'initialization' });
      }
      return false;
    }
    
    if (isCalculating) {
      if (callbacks.onBusy) callbacks.onBusy();
      return false;
    }
    
    // Save callbacks for later use
    callbacksRef.current = callbacks;
    
    // Start calculation
    setIsCalculating(true);
    setError(null);
    
    // Determine if we need to convert parameters
    const workerParams = 'iterations' in params 
      ? params as AttractorWorkerParams
      : prepareWorkerParams(params as AttractorParameters, renderParams);
    
    workerRef.current.postMessage({
      type: 'calculate',
      data: workerParams
    });
    
    return true;
  }, [isReady, isCalculating, prepareWorkerParams]);
  
  /**
   * Run a performance test to determine an appropriate point count
   */
  const testPerformance = useCallback(() => {
    if (!workerRef.current || !isReady) {
      return;
    }
    
    workerRef.current.postMessage({ type: 'performance-test' });
  }, [isReady]);
  
  return {
    isReady,
    isCalculating,
    error,
    performanceRating,
    calculateAttractor,
    prepareWorkerParams,
    testPerformance
  };
}
