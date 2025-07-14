import { type UITab } from "@/store/ui-store"
import { Button } from "../ui/button"
import { ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"

export function SmallMenuSub({ tab, onTabClose }:{ tab: UITab, onTabClose: () => void }) {

  // Get display name for the tab
  const getTabDisplayName = () => {
    switch(tab) {
      case "attractor": return "Attractor";
      case "color": return "Color";
      case "position": return "Position";
      default: return tab;
    }
  }

  return (
    <div className="w-auto max-w-[400px] flex flex-col items-center gap-2">
      {/* Header with back button */}
      <div 
        className={cn(
          "flex justify-start items-center gap-2 w-full max-w-[400px] rounded-md p-2 bg-black/70 border border-white/10 shadow-md",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
          "transition ease-in duration-300",
        )}
        data-state="open"
      >
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={onTabClose}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 text-center font-semibold">
          {getTabDisplayName()}
        </div>
      </div>
      
      {/* Content - Just a placeholder button for now */}
      <div 
        className={cn(
          "w-full max-w-[400px] rounded-md p-3 bg-black/50 shadow-md",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom", 
          "transition ease-in data-[state=open]:duration-500 data-[state=closed]:duration-300",
        )}
        data-state="open"
      >
        <Button 
          variant="outline"
          className="w-full"
        >
          {tab} Parameters
        </Button>
      </div>
    </div>
  )
}