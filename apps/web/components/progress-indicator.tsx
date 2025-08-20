"use client";
import React, { useEffect, useState } from "react";
import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";

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
      <style>{`
        @keyframes slideRight {
          0% {
            transform: translateX(-100px);
          }
          100% {
            transform: translateX(calc(100vw + 100px));
          }
        }
      `}</style>
      <div
        role="progressbar"
        aria-label="Page loading progress"
        aria-valuenow={roundedProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cn(
          `fixed top-0 left-0 right-0 w-screen 
          bg-[rgba(255,255,255,0)] text-[#222] z-[101] p-0 m-0 
          shadow-none flex items-stretch
          h-[3px]`,
        )}
      >
        <div
          className={cn(
            "h-full transition-[width] duration-200 rounded-none relative overflow-hidden",
            { "w-full": roundedProgress === 100 },
          )}
          style={{
            width: `${roundedProgress}%`,
            background:
              "linear-gradient(to right, rgb(59, 130, 246), rgb(29, 78, 216))",
          }}
        >
          {roundedProgress < 100 ? (
            <div
              className="absolute inset-0 w-[50%] h-full"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, #8cc0ff 50%, transparent 100%)",
                animation: "slideRight 1s linear infinite",
              }}
            />
          ) : null}
        </div>
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
