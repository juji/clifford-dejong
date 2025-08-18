"use client";
import { WasmLoopCanvas } from "@/components/attractor-canvas-dynamic/wasm-loop-canvas";
import { Footer } from "@/components/footer";
// import { Header } from "@/components/header";
import { ProgressIndicator } from "@/components/progress-indicator";
import styles from "../page.module.css";
import { useResizeHandler } from "@/hooks/use-resize-handler";
import { useRef } from "react";
import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";

export default function WasmWorker() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasVisible = useUIStore((s) => s.canvasVisible);
  useResizeHandler(containerRef);

  return (
    <div
      className={cn(
        `flex items-center justify-center 
        w-full h-full fixed top-0 left-0 
        ${canvasVisible ? "opacity-100" : "opacity-0"} 
        cursor-grab active:cursor-grabbing`,
      )}
      ref={containerRef}
      style={
        {
          backgroundColor: "var(--cda-bg-canvas)",
        } as React.CSSProperties
      }
    >
      {/* <Header /> */}
      <p className="fixed top-2 z-10 left-2">
        Lab: WASM Worker &gt; single loop
      </p>
      <ProgressIndicator />
      <main className={styles.mainContent}>
        <WasmLoopCanvas />
      </main>
      <Footer />
    </div>
  );
}
