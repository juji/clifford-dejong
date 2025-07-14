import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Bolt } from "lucide-react"
import { useAttractorStore } from "@repo/state/attractor-store"
import { ConfigSelectionDialog } from "@/components/config-selection-dialog"
import { ConfigSaveDialog } from "@/components/config-save-dialog"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import { useUIStore, MenuPosition } from "@/store/ui-store"

export function MenuSheetFooter() {
  const reset = useAttractorStore((s) => s.reset)
  const [loadDialogOpen, setLoadDialogOpen] = useState(false)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const menuPosition = useUIStore((s) => s.menuPosition)
  const setMenuPosition = useUIStore((s) => s.setMenuPosition)

  return (
    <div className="p-4 py-3 border-t border-border text-muted-foreground flex justify-center items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" aria-label="Additional Settings">
            <Bolt className="w-5 h-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" sideOffset={8}>
          <DropdownMenuLabel>Position</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={menuPosition}
            onValueChange={(value) => setMenuPosition(value as MenuPosition)}
          >
            <DropdownMenuRadioItem value="left">Left</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="right">Right</DropdownMenuRadioItem>
            {/* <DropdownMenuRadioItem value="top">Top</DropdownMenuRadioItem> */}
            {/* <DropdownMenuRadioItem value="bottom">Bottom</DropdownMenuRadioItem> */}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        variant="outline"
        size="sm"
        aria-label="Save Settings"
        className="flex-1"
        onClick={() => setSaveDialogOpen(true)}
      >
        save
      </Button>
      <Button
        variant="outline"
        size="sm"
        aria-label="Load Settings"
        className="flex-1"
        onClick={() => setLoadDialogOpen(true)}
      >
        load
      </Button>
      <Button variant="outline" size="sm" aria-label="Reset Settings" className="flex-1" onClick={reset}>
        reset
      </Button>
      <ConfigSelectionDialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen} />
      <ConfigSaveDialog 
        open={saveDialogOpen} 
        onOpenChange={setSaveDialogOpen} 
      />
    </div>
  )
}
