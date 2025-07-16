"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useUIStore } from "@/store/ui-store";
import { MenuSheetFooter } from "./footer";
import { AttractorMenu } from "./attractor-menu";
import { Menu } from "./menu";

export function BigMenu({ className }: { className?: string }) {
  const menuOpen = useUIStore((s) => s.menuOpen);
  const setMenuOpen = useUIStore((s) => s.setMenuOpen);
  const menuPosition = useUIStore((s) => s.menuPosition);

  return (
    <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
      <SheetContent side={menuPosition} className={className || ""}>
        <div
          className="h-full grid"
          style={{ gridTemplateRows: "auto 1fr auto auto" }}
        >
          {/* Top row */}
          <div className="p-4 flex items-center justify-between border-b border-border">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
              <AttractorMenu />
            </SheetHeader>
          </div>
          {/* Middle row (scrollable) */}
          <div
            className="overflow-auto p-4 min-h-0"
            style={
              menuPosition === "top" || menuPosition === "bottom"
                ? { maxHeight: "30vh", minHeight: 0 }
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
  );
}
