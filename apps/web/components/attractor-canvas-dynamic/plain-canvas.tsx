'use client';

import { useUIStore } from "@/store/ui-store";

export function PlainCanvas({ ariaLabel }: { ariaLabel?: string }) {
  const benchmarkResult = useUIStore((s) => s.benchmarkResult);

  return benchmarkResult ? (
    <canvas
      role="img"
      aria-label={ariaLabel}
      style={{ touchAction: "none" }}
      className={`block w-full h-full transition-opacity`}
    />
  ) : null;
}