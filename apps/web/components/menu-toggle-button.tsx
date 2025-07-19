"use client";

import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";
import { MenuIcon } from "lucide-react";
import React, { useState, useEffect } from "react";

export function MenuToggleButton({ className }: { className?: string }) {
  const menuOpen = useUIStore((s) => s.menuOpen);
  const setMenuOpen = useUIStore((s) => s.setMenuOpen);
  const menuPosition = useUIStore((s) => s.menuPosition);
  const [scaleClass, setScaleClass] = useState("scale-60");

  // Match touch scaling with FullScreenButton
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      const isTouch = window.matchMedia(
        "(pointer: coarse), (pointer: none)",
      ).matches;
      setScaleClass(isTouch ? "scale-75" : "scale-60");
    }
  }, []);

  function handleTouchStart(e: React.TouchEvent<HTMLButtonElement>) {
    e.currentTarget.classList.remove("scale-75");
    e.currentTarget.classList.add("scale-60");
  }
  function handleTouchEnd(e: React.TouchEvent<HTMLButtonElement>) {
    e.currentTarget.classList.remove("scale-60");
    e.currentTarget.classList.add("scale-75");
  }

  // Hide button with CSS instead of early return to avoid hook order issues
  return (
    <button
      type="button"
      aria-label={menuOpen ? "Close menu" : "Open menu"}
      aria-expanded={menuOpen}
      aria-controls="menu-sheet"
      onClick={() => setMenuOpen(!menuOpen)}
      className={cn(
        `
        fixed bottom-15 
        ${menuPosition === "left" ? "left-6" : "right-6"}
        z-[200] rounded-full w-16 h-16 bg-background text-foreground 
        shadow-lg border-2 border-foreground outline-none 
        focus-visible:ring-[6px] focus-visible:ring-yellow-400
        cursor-pointer hover:scale-75 transition-transform duration-200
        `,
        scaleClass,
        menuOpen && "hidden",
        className,
      )}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <span className="relative w-8 h-8 mx-auto my-auto flex items-center justify-center">
        <MenuIcon className="size-6" />
      </span>
      <span className="sr-only">Toggle menu</span>
    </button>
  );
}
