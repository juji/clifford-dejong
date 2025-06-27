"use client";
import React from "react";
import { useAttractorStore } from "../../../packages/state/attractor-store";

export function ProgressIndicator() {
  const progress = useAttractorStore((s) => s.progress);
  return (
    <div className="fixed top-0 left-0 right-0 w-screen bg-[rgba(255,255,255,0)] text-[#222] z-[101] h-[2px] p-0 m-0 shadow-none flex items-stretch dark:text-[#eee]">
      <div
        className="h-full transition-[width] duration-200 rounded-none bg-gradient-to-r from-[#4f8cff] to-[#00e0c6]"
        style={{ width: `${Math.round(progress)}%` }}
      />
    </div>
  );
}
