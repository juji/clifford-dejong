"use client";
import React from "react";
import { useUIStore } from "@/store/ui-store";

export function ModeToggleButton() {
  const qualityMode = useUIStore((s) => s.qualityMode);
  const setQualityMode = useUIStore((s) => s.setQualityMode);
  return (
    <button
      type="button"
      className="fixed bottom-6 right-6 z-[201] px-4 py-2 rounded bg-background border border-foreground shadow text-foreground text-xs font-semibold hover:bg-foreground hover:text-background transition-colors"
      onClick={() => setQualityMode(qualityMode === "high" ? "low" : "high")}
      aria-label="Toggle quality mode"
    >
      {qualityMode === "high" ? "Low Quality" : "High Quality"}
    </button>
  );
}
