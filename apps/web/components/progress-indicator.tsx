"use client";
import React, { useEffect, useState } from "react";
import { useUIStore } from "@/store/ui-store";

export function ProgressIndicator() {
  const progress = useUIStore((s) => s.progress);
  const roundedProgress = Math.round(progress);
  const [announceProgress, setAnnounceProgress] = useState(false);

  // Only announce significant progress changes (every 25%)
  useEffect(() => {
    if (
      roundedProgress === 25 ||
      roundedProgress === 50 ||
      roundedProgress === 75 ||
      roundedProgress === 100
    ) {
      setAnnounceProgress(true);
      // Reset after announcement
      const timer = setTimeout(() => setAnnounceProgress(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [roundedProgress]);

  return (
    <>
      <div
        role="progressbar"
        aria-label="Page loading progress"
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
      {/* Aria-live region for announcing progress */}
      {announceProgress && (
        <div aria-live="polite" className="sr-only">
          Progress: {roundedProgress}%
        </div>
      )}
    </>
  );
}
