"use client";
import { useEffect, useState } from "react";

export type WorkerSupport =
  | "wasm"
  | "offscreen"
  | "shared-array"
  | "worker"
  | "none"
  | null;

export function useWorkerSupport() {
  const [supported, setSupported] = useState<WorkerSupport>(null);

  useEffect(() => {
    // Check if offscreen canvas is supported
    const isOffscreenCanvasSupported =
      typeof window !== "undefined" &&
      "OffscreenCanvas" in window &&
      typeof OffscreenCanvas === "function";

    // Check if SharedArrayBuffer is supported
    const isSharedArrayBufferSupported =
      typeof window !== "undefined" &&
      typeof SharedArrayBuffer !== "undefined" &&
      // Check if the browser has the necessary security headers to use SharedArrayBuffer
      typeof crossOriginIsolated !== "undefined" &&
      crossOriginIsolated;

    // Check if basic Web Workers are supported
    const isWorkerSupported =
      typeof window !== "undefined" &&
      typeof Worker !== "undefined" &&
      typeof window.URL !== "undefined" &&
      typeof window.URL.createObjectURL === "function";

    // Check if wasm is supported
    const isWasmSupported =
      typeof window !== "undefined" &&
      typeof WebAssembly !== "undefined" &&
      typeof WebAssembly.instantiate === "function";

    if (
      isWasmSupported &&
      isSharedArrayBufferSupported &&
      isOffscreenCanvasSupported &&
      isWorkerSupported
    ) {
      setSupported("wasm");
    } else if (isOffscreenCanvasSupported && isWorkerSupported) {
      setSupported("offscreen");
    } else if (isSharedArrayBufferSupported && isWorkerSupported) {
      setSupported("shared-array");
    } else if (isWorkerSupported) {
      setSupported("worker");
    } else {
      setSupported("none");
    }
  }, []);

  return supported;
}
