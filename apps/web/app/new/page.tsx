"use client";
import React from "react";
import { useWasmModule } from "@/hooks/wasm/use-wasm-module";
import dynamic from "next/dynamic";

// Use dynamic import with ssr:false to ensure the component only loads on client side
const WasmGreeting = dynamic(
  () =>
    Promise.resolve(() => {
      const { greeting, isLoading, error, isWasmSupported } = useWasmModule();

      if (isLoading) return <p>Loading WebAssembly...</p>;
      if (error) return <p>Error: {error.message}</p>;
      if (isWasmSupported === false)
        return (
          <p className="text-red-500">
            Your browser does not support WebAssembly
          </p>
        );

      return <h1 className="text-4xl font-bold">{greeting}</h1>;
    }),
  { ssr: false },
);

export default function NewPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <WasmGreeting />
      <p className="mt-4 text-gray-500">
        This text comes from a WebAssembly module written in C++
      </p>
    </div>
  );
}
