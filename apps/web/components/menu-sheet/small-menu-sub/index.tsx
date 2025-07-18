import { type UITab, useUIStore } from "@/store/ui-store";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAttractorStore } from "@repo/state/attractor-store";
import { useState, useRef, useEffect, useCallback } from "react";
import AttractorTab from "./attractor-tab";
import ColorTab from "./color-tab";
import PositionTab from "./position-tab";

/**
 * Hook to handle keyboard navigation for SmallMenuSub
 * Implements focus trapping and ESC key handling
 */
function useSmallMenuSubKeyboard({
  onTabClose,
}: {
  onTabClose: () => void;
}) {
  // Create ref for the back button
  const backButtonRef = useRef<HTMLButtonElement>(null);
  
  // Handle keyboard events
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          e.preventDefault();
          onTabClose();
          break;
          
        case "Tab": {
          // Get all focusable elements within the tab content
          const focusableElements = 
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
          
          const tabPanel = document.querySelector('[role="tabpanel"]');
          if (!tabPanel) return;
          
          const focusableContent = Array.from(
            tabPanel.querySelectorAll(focusableElements)
          ) as HTMLElement[];
          
          // If there are no focusable elements, don't try to trap focus
          if (focusableContent.length === 0) return;
          
          // Add the back button to the beginning of our focusables array
          const allFocusableElements = backButtonRef.current
            ? [backButtonRef.current, ...focusableContent]
            : focusableContent;
          
          // Check if we're at the first or last element
          const firstElement = allFocusableElements[0];
          const lastElement = allFocusableElements[allFocusableElements.length - 1];
          
          const isFirstElement = document.activeElement === firstElement;
          const isLastElement = document.activeElement === lastElement;
          
          // Create a focus trap
          if (isLastElement && !e.shiftKey) {
            e.preventDefault();
            firstElement?.focus();
          } else if (isFirstElement && e.shiftKey) {
            e.preventDefault();
            lastElement?.focus();
          }
          break;
        }
      }
    },
    [onTabClose]
  );
  
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    // Focus the back button when the component mounts
    setTimeout(() => {
      backButtonRef.current?.focus();
    }, 100);
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);
  
  return {
    backButtonRef
  };
}

export function SmallMenuSub({
  tab,
  onTabClose,
}: {
  tab: UITab;
  onTabClose: () => void;
}) {
  const attractorParameters = useAttractorStore((s) => s.attractorParameters);
  const setAttractorParams = useAttractorStore((s) => s.setAttractorParams);

  // Quality mode management
  const setQualityMode = useUIStore((s) => s.setQualityMode);
  const qualityMode = useUIStore((s) => s.qualityMode);
  const qualityModeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // State to track which parameter is being edited
  const [editingParam, setEditingParam] = useState<string | null>(null);

  // Get display name for the tab
  const getTabDisplayName = () => {
    switch (tab) {
      case "attractor":
        return "Attractor";
      case "color":
        return "Color";
      case "position":
        return "Position";
      default:
        return tab;
    }
  };

  // Handle parameter value changes with quality mode handling
  const handleSliderChange = (values: number[], param: string) => {
    const value = values[0];

    // Set quality mode to low during parameter changes
    if (qualityMode === "high") setQualityMode("low");

    // Clear any existing timeout
    if (qualityModeTimeoutRef.current) {
      clearTimeout(qualityModeTimeoutRef.current);
    }

    // Set a timeout to switch back to high quality after 2 seconds
    qualityModeTimeoutRef.current = setTimeout(() => {
      setQualityMode("high");
    }, 2000);

    switch (tab) {
      case "attractor":
        setAttractorParams({
          ...attractorParameters,
          [param]: value,
        });
        break;
      case "color":
        if (
          param === "hue" ||
          param === "saturation" ||
          param === "brightness"
        ) {
          setAttractorParams({
            ...attractorParameters,
            [param]: value,
          });
        }
        break;
      case "position":
        if (param === "scale" || param === "left" || param === "top") {
          setAttractorParams({
            ...attractorParameters,
            [param]: value,
          });
        }
        break;
    }
  };

  // Use the keyboard hook to manage focus trapping and keyboard navigation
  const { backButtonRef } = useSmallMenuSubKeyboard({
    onTabClose,
  });
  
  return (
    <div
      className={cn(
        "fixed bottom-[42px] left-1/2 -translate-x-1/2 z-[202] flex flex-col items-center gap-2 pb-3",
        editingParam === null
          ? "w-auto max-w-[400px]"
          : "w-[95%] sm:w-[80%] md:w-[70%] max-w-[800px]",
      )}
      role="dialog"
      aria-modal="true"
      aria-label={`${getTabDisplayName()} settings`}
    >
      {/* Header with back button */}
      <div
        className={cn(
          "flex justify-start items-center gap-2 w-full rounded-md p-2 bg-black/70 border border-white/10 shadow-md",
        )}
      >
        <Button
          ref={backButtonRef}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={onTabClose}
          aria-label="Back to menu"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 text-center font-semibold px-2">
          {getTabDisplayName()}
        </div>
      </div>

      {/* Parameters as buttons - horizontal layout */}
      <div
        className={cn(
          "w-full rounded-md p-3 bg-black/50 shadow-md",
          editingParam === null ? "max-w-[400px]" : "max-w-[800px]",
        )}
        role="tabpanel"
        aria-label={`${getTabDisplayName()} controls`}
      >
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
  );
}

export default SmallMenuSub;
