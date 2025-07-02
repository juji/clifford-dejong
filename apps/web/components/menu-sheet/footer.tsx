import { useState } from "react"
import { Button } from "../ui/button"
import { Bolt } from "lucide-react"
import { useAttractorStore } from "@repo/state/attractor-store"
import { ConfigSelectionDialog } from "../config-selection-dialog"
import { ConfigSaveDialog } from "../config-save-dialog"

export function MenuSheetFooter() {
  const reset = useAttractorStore((s) => s.reset)
  const [loadDialogOpen, setLoadDialogOpen] = useState(false)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  return (
    <div className="p-4 py-3 border-t border-border text-muted-foreground flex justify-center items-center gap-2">
      <Button variant="outline" size="sm" aria-label="Additional Settings">
        <Bolt className="w-5 h-5" />
      </Button>
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
      <ConfigSaveDialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen} />
    </div>
  )
}
