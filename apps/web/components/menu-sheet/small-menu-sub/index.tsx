import { type UITab, useUIStore } from "@/store/ui-store"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAttractorStore } from "@repo/state/attractor-store"
import { useState, useRef } from "react"
import AttractorTab from "./attractor-tab"
import ColorTab from "./color-tab"
import PositionTab from "./position-tab"

export function SmallMenuSub({ tab, onTabClose }:{ tab: UITab, onTabClose: () => void }) {
  const attractorParameters = useAttractorStore((s) => s.attractorParameters)
  const setAttractorParams = useAttractorStore((s) => s.setAttractorParams)
  
  // Quality mode management
  const setQualityMode = useUIStore((s) => s.setQualityMode)
  const qualityMode = useUIStore((s) => s.qualityMode)
  const qualityModeTimeoutRef = useRef<ReturnType<typeof setTimeout>|null>(null)
  
  // State to track which parameter is being edited
  const [editingParam, setEditingParam] = useState<string | null>(null)
  
  // Get display name for the tab
  const getTabDisplayName = () => {
    switch(tab) {
      case "attractor": return "Attractor";
      case "color": return "Color";
      case "position": return "Position";
      default: return tab;
    }
  }
  
  // Handle parameter value changes with quality mode handling
  const handleSliderChange = (values: number[], param: string) => {
    const value = values[0];
    
    // Set quality mode to low during parameter changes
    if (qualityMode === 'high') setQualityMode("low");
    
    // Clear any existing timeout
    if (qualityModeTimeoutRef.current) {
      clearTimeout(qualityModeTimeoutRef.current);
    }
    
    // Set a timeout to switch back to high quality after 2 seconds
    qualityModeTimeoutRef.current = setTimeout(() => {
      setQualityMode("high");
    }, 2000);
    
    switch(tab) {
      case "attractor":
        setAttractorParams({
          ...attractorParameters,
          [param]: value
        });
        break;
      case "color":
        if (param === "hue" || param === "saturation" || param === "brightness") {
          setAttractorParams({
            ...attractorParameters,
            [param]: value
          });
        }
        break;
      case "position":
        if (param === "scale" || param === "left" || param === "top") {
          setAttractorParams({
            ...attractorParameters,
            [param]: value
          });
        }
        break;
    }
  }

  return (
    <div className={cn(
      "fixed bottom-[42px] left-1/2 -translate-x-1/2 z-[202] flex flex-col items-center gap-2 pb-3",
      editingParam === null ? "w-auto max-w-[400px]" : "w-[95%] sm:w-[80%] md:w-[70%] max-w-[800px]"
    )}>
      {/* Header with back button */}
      <div 
        className={cn(
          "flex justify-start items-center gap-2 w-full rounded-md p-2 bg-black/70 border border-white/10 shadow-md"
        )}
      >
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={onTabClose}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 text-center font-semibold px-2">
          {getTabDisplayName()}
        </div>
      </div>
      
      {/* Parameters as buttons - horizontal layout */}
      <div className={cn(
        "w-full rounded-md p-3 bg-black/50 shadow-md",
        editingParam === null ? "max-w-[400px]" : "max-w-[800px]"
      )}>
        {tab === "attractor" && (
          <AttractorTab 
            attractorParameters={attractorParameters}
            setAttractorParams={setAttractorParams}
            editingParam={editingParam}
            setEditingParam={setEditingParam}
            handleSliderChange={handleSliderChange}
          />
        )}
        
        {tab === "color" && (
          <ColorTab 
            attractorParameters={attractorParameters}
            setAttractorParams={setAttractorParams}
            editingParam={editingParam}
            setEditingParam={setEditingParam}
            handleSliderChange={handleSliderChange}
          />
        )}
        
        {tab === "position" && (
          <PositionTab 
            attractorParameters={attractorParameters}
            setAttractorParams={setAttractorParams}
            editingParam={editingParam}
            setEditingParam={setEditingParam}
            handleSliderChange={handleSliderChange}
          />
        )}
      </div>
    </div>
  )
}

export default SmallMenuSub;
