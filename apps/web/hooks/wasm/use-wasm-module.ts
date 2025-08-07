"use client";
import { useState, useEffect } from "react";

export function useWasmModule() {
  const [greeting, setGreeting] = useState<string>("Loading WASM...");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isWasmSupported, setIsWasmSupported] = useState<boolean | null>(null);
  const [worker, setWorker] = useState<Worker | null>(null);

  useEffect(() => {
    // Check if WebAssembly and Web Workers are supported
    if (typeof WebAssembly === "undefined") {
      setError(new Error("WebAssembly is not supported in this browser"));
      setGreeting("WebAssembly not supported");
      setIsLoading(false);
      setIsWasmSupported(false);
      return;
    }

    if (typeof Worker === "undefined") {
      setError(new Error("Web Workers are not supported in this browser"));
      setGreeting("Web Workers not supported");
      setIsLoading(false);
      return;
    }

    setIsWasmSupported(true);

    // Create a Web Worker to run the WebAssembly code
    const wasmWorker = new Worker("/wasm-worker.js");
    setWorker(wasmWorker);

    // Set up message handlers
    wasmWorker.onmessage = (event) => {
      const { type, result, message, error: workerError, success } = event.data;

      switch (type) {
        case "initialized":
          if (success) {
            // After initialization, request the greeting
            wasmWorker.postMessage({ type: "getGreeting" });
          }
          break;

        case "greeting":
          setGreeting(result);
          setIsLoading(false);
          break;

        case "error":
          console.error("Worker error:", message, workerError);
          setError(new Error(message));
          setGreeting("Error: " + message);
          setIsLoading(false);
          break;
      }
    };

    // Handle worker errors
    wasmWorker.onerror = (error) => {
      console.error("Web Worker error:", error);
      setError(new Error("Web Worker failed: " + error.message));
      setGreeting("Error loading WASM");
      setIsLoading(false);
    };

    // Initialize the worker
    wasmWorker.postMessage({ type: "init" });

    // Cleanup function
    return () => {
      wasmWorker.terminate();
      setWorker(null);
    };
  }, []);

  return { greeting, isLoading, error, isWasmSupported };
}
