"use client";
import { useState, useEffect } from "react";

// Define the interface for our WASM module instance
interface HelloModuleInstance {
  getGreeting: () => string;
}

export function useWasmModule() {
  const [greeting, setGreeting] = useState<string>("Loading WASM...");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Create a script element to load the WASM JavaScript glue code
    const script = document.createElement("script");
    script.src = "/hello.js";
    script.async = true;

    script.onload = async () => {
      try {
        // Access the global HelloModule created by the script
        // @ts-ignore - HelloModule is loaded globally by the script
        const module = window.HelloModule as () => Promise<HelloModuleInstance>;
        const instance = await module();

        // Get greeting from WASM
        const result = instance.getGreeting();
        setGreeting(result);
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to load WASM module:", err);
        setError(
          err instanceof Error ? err : new Error("Unknown error loading WASM"),
        );
        setGreeting("Error loading WASM");
        setIsLoading(false);
      }
    };

    script.onerror = () => {
      console.error("Failed to load WASM script");
      setError(new Error("Failed to load WASM script"));
      setGreeting("Error loading WASM");
      setIsLoading(false);
    };

    // Add the script to the document
    document.body.appendChild(script);

    // Cleanup function
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return { greeting, isLoading, error };
}
