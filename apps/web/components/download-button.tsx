"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/store/ui-store";
import React, { useState, useEffect } from "react";
import styles from "./download-button.module.css";
import { cn } from "@/lib/utils";

export function DownloadButton() {
  const imageUrl = useUIStore((s) => s.imageUrl);
  const menuOpen = useUIStore((s) => s.menuOpen);
  const [scaleClass, setScaleClass] = useState("scale-60");

  // Match touch scaling with other action buttons
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      const isTouch = window.matchMedia(
        "(pointer: coarse), (pointer: none)",
      ).matches;
      setScaleClass(isTouch ? "scale-75" : "scale-60");
    }
  }, []);

  if (menuOpen || !imageUrl) return null;

  function handleDownload() {
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `attractor-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <Button
      type="button"
      aria-label="Download attractor image"
      onClick={handleDownload}
      className={cn(`
        fixed 
        bottom-15 
        left-1/2 -translate-x-1/2
        z-[200] 
        rounded-full min-w-40 h-16 px-8 bg-background text-foreground 
        shadow-lg border-2 border-foreground focus:outline-none focus:ring-2 
        focus:ring-ring cursor-pointer hover:scale-75 
        transition-transform duration-200 ${scaleClass} 
        hover:bg-background hover:text-foreground overflow-hidden ${styles.downloadButton}`)}
      size="default"
    >
      <span className="relative w-full h-full flex flex-row items-center justify-center gap-2">
        <Download className="size-6" />
        <span className="text-lg font-semibold">Download</span>
      </span>
    </Button>
  );
}
