import { useUIStore, type UITab } from "@/store/ui-store";
import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useAttractorStore } from "@repo/state/attractor-store";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ConfigSelectionDialog } from "@/components/config-selection-dialog";
import { ConfigSaveDialog } from "@/components/config-save-dialog";
import { SmallMenuSub } from "./small-menu-sub";

/**
 * Hook to handle keyboard navigation for SmallMenu
 * Implements ESC key to close tabs or menu
 * Manages focus cycling between buttons
 */
function useSmallMenuKeyboard({
  menuOpen,
  setMenuOpen,
  openTab,
  setOpenTab,
  loadDialogOpen,
  saveDialogOpen,
  dialogJustClosedRef,
}: {
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  openTab: UITab | null;
  setOpenTab: (tab: UITab | null) => void;
  loadDialogOpen: boolean;
  saveDialogOpen: boolean;
  dialogJustClosedRef: React.RefObject<boolean>;
}) {
  // Create refs for the buttons to be able to focus them
  const attractorBtnRef = useRef<HTMLButtonElement>(null);
  const colorBtnRef = useRef<HTMLButtonElement>(null);
  const positionBtnRef = useRef<HTMLButtonElement>(null);
  const saveBtnRef = useRef<HTMLButtonElement>(null);
  const loadBtnRef = useRef<HTMLButtonElement>(null);
  const originBtnRef = useRef<HTMLButtonElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // If menu is not open, don't handle any keyboard events
      if (!menuOpen) return;

      // Special case for Escape key when dialogs are open:
      // Let the dialogs handle the ESC key themselves, but still handle Tab navigation
      if (loadDialogOpen || saveDialogOpen) {
        if (e.key === "Escape") {
          // We need to stop propagation to prevent the menu from closing
          e.stopPropagation();
          e.preventDefault();
          // The dialog will handle its own closing via onEscapeKeyDown
          // Focus restoration happens in onOpenChange handlers
          return;
        }
        if (e.key !== "Tab") return; // Only process Tab navigation
      }

      if (openTab) {
        // When a tab is open, only handle ESC
        if (e.key === "Escape") {
          e.preventDefault();
          setOpenTab(null);
        }
      } else {
        // Main menu navigation
        switch (e.key) {
          case "Escape":
            // If a dialog was just closed, don't close the menu
            if (dialogJustClosedRef.current) {
              e.preventDefault();
              e.stopPropagation();
              return;
            }
            e.preventDefault();
            setMenuOpen(false);
            break;
          
          case "Tab": {
            // If dialogs are open, don't create focus trap in the menu
            if (loadDialogOpen || saveDialogOpen) return;
            
            // Create a focus trap to cycle focus within our menu buttons
            const buttons = [
              attractorBtnRef.current,
              colorBtnRef.current,
              positionBtnRef.current,
              saveBtnRef.current,
              loadBtnRef.current,
              originBtnRef.current
            ].filter(Boolean);
            
            // If there are no buttons, don't try to trap focus
            if (buttons.length === 0) return;
            
            // Check if the active element is the last button (origin)
            const activeElement = document.activeElement;
            const isLastButton = activeElement === originBtnRef.current;
            
            // If we're on the last button and pressing Tab (without shift)
            if (isLastButton && !e.shiftKey) {
              e.preventDefault();
              // Focus back to the first button (attractor)
              attractorBtnRef.current?.focus();
            }
            
            // If we're on the first button and pressing Shift+Tab
            const isFirstButton = activeElement === attractorBtnRef.current;
            if (isFirstButton && e.shiftKey) {
              e.preventDefault();
              // Focus the last button (origin)
              originBtnRef.current?.focus();
            }
            break;
          }
        }
      }
    },
    [
      menuOpen,
      openTab,
      setOpenTab,
      setMenuOpen,
      loadDialogOpen,
      saveDialogOpen,
      dialogJustClosedRef
    ]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);
  
  return {
    attractorBtnRef,
    colorBtnRef,
    positionBtnRef,
    saveBtnRef,
    loadBtnRef,
    originBtnRef
  };
}

export function SmallMenu({ className }: { className?: string }) {
  const menuOpen = useUIStore((s) => s.menuOpen);
  const setMenuOpen = useUIStore((s) => s.setMenuOpen);
  const reset = useAttractorStore((s) => s.reset);

  // For save/load dialog state
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  
  // Track which button opened a dialog to restore focus when it closes
  const lastFocusedButton = useRef<HTMLButtonElement | null>(null);
  
  // Track if a dialog was just closed to prevent ESC from also closing the menu
  const dialogJustClosedRef = useRef<boolean>(false);
  
  const [isOpen, setIsOpen] = useState(menuOpen);
  const setMenuOpenRef = useRef<null | ReturnType<typeof setTimeout>>(null);
  useEffect(() => {
    if (setMenuOpenRef.current) clearTimeout(setMenuOpenRef.current);
    if (menuOpen && !isOpen) setIsOpen(true);
    else if (!menuOpen && isOpen) {
      setMenuOpenRef.current = setTimeout(() => {
        setIsOpen(false);
      }, 300);
      // Reset the open tab when menu is closed
      setOpenTab(null);
    }

    return () => {
      if (setMenuOpenRef.current) clearTimeout(setMenuOpenRef.current);
    };
  }, [menuOpen, isOpen]);

  const [openTab, setOpenTab] = useState<UITab | null>(null);

  const handleTabChange = (tab: UITab) => {
    setOpenTab(tab);
  };

  const handleTabClose = () => {
    setOpenTab(null);
  };

  // Use the keyboard navigation hook which manages focus
  const {
    attractorBtnRef,
    colorBtnRef,
    positionBtnRef,
    saveBtnRef,
    loadBtnRef,
    originBtnRef
  } = useSmallMenuKeyboard({
    menuOpen,
    setMenuOpen,
    openTab,
    setOpenTab,
    loadDialogOpen,
    saveDialogOpen,
    dialogJustClosedRef,
  });

  if (!isOpen) return null;

  return (
    <>
      <div
        className={cn("fixed bottom-0 left-0 z-[200] w-full h-full", className)}
      >
        <div
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-full h-full fixed bottom-0 left-0 z-[201] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          data-state={menuOpen ? "open" : "closed"}
        ></div>

        {openTab ? (
          <SmallMenuSub onTabClose={handleTabClose} tab={openTab} />
        ) : (
          <div 
            className="fixed bottom-[42px] left-1/2 -translate-x-1/2 z-[202] w-auto max-w-[400px] flex flex-col items-center gap-2 pb-3"
            role="dialog" 
            aria-modal="true"
          >
            {/* Primary Menu - Attractor, Color, Position */}
            <div
              className={cn(
                "flex justify-center items-center gap-1.5 w-full max-w-[400px] rounded-md p-2 bg-black/70 border border-white/10 shadow-md",
                "data-[state=open]:animate-in data-[state=closed]:animate-out",
                "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
                "transition ease-in duration-300 data-[state=closed]:delay-100",
              )}
              data-state={menuOpen ? "open" : "closed"}
            >
              <Button
                ref={attractorBtnRef}
                variant="outline"
                size="sm"
                className="flex-1 text-xs h-8"
                onClick={() => handleTabChange("attractor")}
                tabIndex={0} /* Explicitly set tabIndex to make it the first focusable element */
                autoFocus /* Add autoFocus as an extra hint to the browser */
              >
                Attractor
              </Button>
              <Button
                ref={colorBtnRef}
                variant="outline"
                size="sm"
                className="flex-1 text-xs h-8"
                onClick={() => handleTabChange("color")}
              >
                Color
              </Button>
              <Button
                ref={positionBtnRef}
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
              data-state={menuOpen ? "open" : "closed"}
            >
              <Button
                ref={saveBtnRef}
                variant="outline"
                size="sm"
                className="flex-1 text-xs h-7 px-2"
                onClick={() => {
                  lastFocusedButton.current = saveBtnRef.current;
                  setSaveDialogOpen(true);
                }}
              >
                Save
              </Button>
              <Button
                ref={loadBtnRef}
                variant="outline"
                size="sm"
                className="flex-1 text-xs h-7 px-2"
                onClick={() => {
                  lastFocusedButton.current = loadBtnRef.current;
                  setLoadDialogOpen(true);
                }}
              >
                Load
              </Button>
              <Button
                ref={originBtnRef}
                variant="outline"
                size="sm"
                className="flex-1 text-xs h-7 px-2"
                onClick={reset}
              >
                Origin
              </Button>
            </div>
          </div>
        )}
      </div>
      {/* Dialogs for save/load functionality */}
      <ConfigSelectionDialog
        open={loadDialogOpen}
        onOpenChange={(open: boolean) => {
          setLoadDialogOpen(open);
          // When dialog is closing, restore focus to the button that opened it
          if (!open && lastFocusedButton.current) {
            // Set flag that dialog was just closed
            dialogJustClosedRef.current = true;
            
            // Reset the flag after a short delay
            setTimeout(() => {
              dialogJustClosedRef.current = false;
            }, 100);
            
            // Restore focus after a short delay
            setTimeout(() => {
              lastFocusedButton.current?.focus();
            }, 10);
          }
        }}
      />
      <ConfigSaveDialog
        open={saveDialogOpen}
        onOpenChange={(open: boolean) => {
          setSaveDialogOpen(open);
          // When dialog is closing, restore focus to the button that opened it
          if (!open && lastFocusedButton.current) {
            // Set flag that dialog was just closed
            dialogJustClosedRef.current = true;
            
            // Reset the flag after a short delay
            setTimeout(() => {
              dialogJustClosedRef.current = false;
            }, 100);
            
            // Restore focus after a short delay
            setTimeout(() => {
              lastFocusedButton.current?.focus();
            }, 10);
          }
        }}
      />
    </>
  );
}
