import { useState } from "react"
import { Button } from "../ui/button"
import { Bolt } from "lucide-react"
import { useAttractorStore } from "@repo/state/attractor-store"
import { ConfigDialog } from "../config-dialog"

export function MenuSheetFooter() {
  const reset = useAttractorStore((s) => s.reset)
  const [dialogOpen, setDialogOpen] = useState(false)
  return (
    <div className="p-4 py-3 border-t border-border text-muted-foreground flex justify-center items-center gap-2">
      <Button variant="outline" size="sm" aria-label="Bolt">
        <Bolt className="w-5 h-5" />
      </Button>
      <Button variant="outline" size="sm" aria-label="Save" className="flex-1">
        save
      </Button>
      <Button
        variant="outline"
        size="sm"
        aria-label="Load"
        className="flex-1"
        onClick={() => setDialogOpen(true)}
      >
        load
      </Button>
      <Button variant="outline" size="sm" aria-label="Reset" className="flex-1" onClick={reset}>
        reset
      </Button>
      <ConfigDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
