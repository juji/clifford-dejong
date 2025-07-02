"use client"

import { useUIStore } from "../store/ui-store"
import { cn } from "@/lib/utils"
import { MenuIcon } from "lucide-react"
import { useTouchScale } from "../hooks/use-touch-scale"

export function MenuToggleButton({ className }: { className?: string }) {
  const menuOpen = useUIStore((s) => s.menuOpen)
  const setMenuOpen = useUIStore((s) => s.setMenuOpen)
  const { scaleClass, handleTouchStart, handleTouchEnd } = useTouchScale()

  // Hide button with CSS instead of early return to avoid hook order issues
  return (
    <button
      type="button"
      aria-label={menuOpen ? "Close menu" : "Open menu"}
      onClick={() => setMenuOpen(!menuOpen)}
      className={cn(
        "fixed bottom-15 left-6 z-[200] rounded-full w-16 h-16 bg-background text-foreground shadow-lg border-2 border-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer hover:scale-75 transition-transform duration-200",
        scaleClass,
        menuOpen && "hidden",
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <span className="relative w-8 h-8 mx-auto my-auto flex items-center justify-center">
        <MenuIcon className="size-6" />
      </span>
      <span className="sr-only">Toggle menu</span>
    </button>
  )
}
