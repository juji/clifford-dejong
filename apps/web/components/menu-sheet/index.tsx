"use client"

import { Sheet, SheetContent, SheetHeader } from "../ui/sheet"
import { useUIStore } from "../../store/ui-store"
import { useEffect, useState } from "react"
import { MenuSheetFooter } from "./footer"
import { AttractorMenu } from "./attractor-menu"
import { Menu } from "./menu"

export function MenuSheet() {

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

  return (
    <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
      <SheetContent side={responsiveSide}>
        <div className="h-full grid" style={{ gridTemplateRows: 'auto 1fr auto auto' }}>
          {/* Top row */}
          <div className="p-4 flex items-center justify-between border-b border-border">
            <SheetHeader>
              {/* <SheetTitle>Menu</SheetTitle> */}
              <AttractorMenu />
            </SheetHeader>
          </div>
          {/* Middle row (scrollable) */}
          <div
            className="overflow-auto p-4 min-h-0"
            style={
              (responsiveSide === 'top' || responsiveSide === 'bottom')
                ? { maxHeight: '30vh', minHeight: 0 }
                : { minHeight: 0 }
            }
          >
            <Menu />
          </div>
          {/* Footer row */}
          <MenuSheetFooter />
          {/* Spacer row (same height as footer, below footer) */}
          <div style={{ height: "43px" }} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
