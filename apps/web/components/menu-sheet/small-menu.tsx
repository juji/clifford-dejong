import { useUIStore } from "@/store/ui-store"
import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { useAttractorStore } from "@repo/state/attractor-store"
import { Button } from "../ui/button"
import { type UITab } from "@/store/ui-store"
import { ConfigSelectionDialog } from "../config-selection-dialog"
import { ConfigSaveDialog } from "../config-save-dialog"
import { SmallMenuSub } from "./small-menu-sub"

export function SmallMenu({ className }: { className?: string }) {
  const menuOpen = useUIStore((s) => s.menuOpen)
  const setMenuOpen = useUIStore((s) => s.setMenuOpen)
  const reset = useAttractorStore((s) => s.reset)
  
  // For save/load dialog state
  const [loadDialogOpen, setLoadDialogOpen] = useState(false)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  
  const [ isOpen, setIsOpen ] = useState(menuOpen);
  const setMenuOpenRef = useRef<null|ReturnType<typeof setTimeout>>(null);
  useEffect(() => {
    if(setMenuOpenRef.current) clearTimeout(setMenuOpenRef.current);
    if(menuOpen && !isOpen) setIsOpen(true)
    else if(!menuOpen && isOpen){
      setMenuOpenRef.current = setTimeout(() => { setIsOpen(false) },300)
      // Reset the open tab when menu is closed
      setOpenTab(null)
    }

    return () => {
      if(setMenuOpenRef.current) clearTimeout(setMenuOpenRef.current);
    }
  }, [menuOpen, isOpen])

  const [openTab, setOpenTab] = useState<UITab|null>(null);
  const handleTabChange = (tab: UITab) => {
    setOpenTab(tab)
  };

  const handleTabClose = () => {
    setOpenTab(null); 
  };

  if (!isOpen) return null;
  
  return (
    <>
      <div className={cn("fixed bottom-0 left-0 z-[200] w-full h-full", className)}>
        <div 
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-full h-full fixed bottom-0 left-0 z-[201] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          data-state={menuOpen ? 'open' : 'closed'}
        ></div>

        {openTab ? <SmallMenuSub onTabClose={handleTabClose} tab={openTab} /> : (
          <div className="fixed bottom-[42px] left-1/2 -translate-x-1/2 z-[202] w-auto max-w-[400px] flex flex-col items-center gap-2 pb-3">
            {/* Primary Menu - Attractor, Color, Position */}
            <div 
              className={cn(
                "flex justify-center items-center gap-1.5 w-full max-w-[400px] rounded-md p-2 bg-black/70 border border-white/10 shadow-md",
                "data-[state=open]:animate-in data-[state=closed]:animate-out",
                "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
                "transition ease-in duration-300 data-[state=closed]:delay-100",
              )}
              data-state={menuOpen ? 'open' : 'closed'}
            >
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs h-8"
                onClick={() => handleTabChange("attractor")}
              >
                Attractor
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs h-8"
                onClick={() => handleTabChange("color")}
              >
                Color
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs h-8"
                onClick={() => handleTabChange("position")}
              >
                Position
              </Button>
            </div>
            
            {/* Secondary Menu - Save, Load, Reset */}
            <div 
              className={cn(
                "flex justify-center items-center gap-1.5 w-full max-w-[300px] rounded-md p-2 bg-black/50 shadow-md",
                "data-[state=open]:animate-in data-[state=closed]:animate-out",
                "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom", 
                "transition ease-in data-[state=open]:duration-500 data-[state=closed]:duration-300",
              )}
              data-state={menuOpen ? 'open' : 'closed'}
            >
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs h-7 px-2"
                onClick={() => setSaveDialogOpen(true)}
              >
                Save
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs h-7 px-2"
                onClick={() => setLoadDialogOpen(true)}
              >
                Load
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs h-7 px-2"
                onClick={reset}
              >
                Reset
              </Button>
            </div>
          </div>
        )}
      </div>
      {/* Dialogs for save/load functionality */}
      <ConfigSelectionDialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen} />
      <ConfigSaveDialog 
        open={saveDialogOpen} 
        onOpenChange={setSaveDialogOpen} 
      />
    </>
  )

}