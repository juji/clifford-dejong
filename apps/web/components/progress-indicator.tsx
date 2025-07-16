"use client";
import React from "react";
import { useUIStore } from "@/store/ui-store";

export function ProgressIndicator() {
  const progress = useUIStore((s) => s.progress);
  const roundedProgress = Math.round(progress);
  return (
    <div
      role="progressbar"
      aria-valuenow={roundedProgress}
      aria-valuemin={0}
      aria-valuemax={100}
      className="fixed top-0 left-0 right-0 w-screen bg-[rgba(255,255,255,0)] text-[#222] z-[101] h-[2px] p-0 m-0 shadow-none flex items-stretch"
    >
      <div
        className="h-full transition-[width] duration-200 rounded-none bg-gradient-to-r from-[#4f8cff] to-[#00e0c6]"
        style={{ width: `${roundedProgress}%` }}
      />
    </div>
  );
}
