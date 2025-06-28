"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "../ui/sheet"
import { useUIStore } from "../../store/ui-store"
import { ReactNode, useEffect, useState } from "react"
import { MenuSheetFooter } from "./footer"

export function MenuSheet({ children }: { children?: ReactNode }) {
  const menuOpen = useUIStore((s) => s.menuOpen)
  const setMenuOpen = useUIStore((s) => s.setMenuOpen)
  const menuPosition = useUIStore((s) => s.menuPosition)
  // Local state for responsive menu side
  const [responsiveSide, setResponsiveSide] = useState(menuPosition)

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth <= 640) {
        setResponsiveSide('bottom')
      } else {
        setResponsiveSide(menuPosition)
      }
    }
    handleResize();
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [menuPosition])

  // Footer height (matches spacer row)
  const footerHeight = "43px";

  return (
    <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
      <SheetContent side={responsiveSide}>
        <div className="h-full grid" style={{ gridTemplateRows: `auto 1fr auto auto` }}>
          {/* Top row */}
          <div className="p-4 flex items-center justify-between border-b border-border">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
              <SheetDescription>
                {/* Add a description or leave empty */}
                Example: Quick navigation and settings
              </SheetDescription>
            </SheetHeader>
          </div>
          {/* Middle row (scrollable) */}
          <div className="overflow-auto p-4">
            {/* Example dynamic content */}
            <div className="space-y-4">
              <div className="bg-muted rounded p-3">Dynamic content goes here. This area scrolls if content overflows.</div>
              <div className="bg-muted rounded p-3">Try adding more content to see scrolling in action.</div>
              <div className="bg-muted rounded p-3">You can put forms, lists, or anything else here.</div>
            </div>
            {children}
          </div>
          {/* Footer row */}
          <MenuSheetFooter footerHeight={footerHeight} />
          {/* Spacer row (same height as footer, below footer) */}
          <div style={{ height: footerHeight }} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
