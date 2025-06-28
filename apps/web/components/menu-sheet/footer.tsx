import { Button } from "../ui/button"
import { Bolt } from "lucide-react"

export function MenuSheetFooter() {
  return (
    <div className="p-4 border-t border-border text-muted-foreground flex justify-center items-center gap-2">
      <Button variant="ghost" size="sm" aria-label="Bolt">
        <Bolt className="w-5 h-5" />
      </Button>
      <Button variant="ghost" size="sm" aria-label="Save" className="flex-1">
        save
      </Button>
      <Button variant="ghost" size="sm" aria-label="Load" className="flex-1">
        load
      </Button>
      <Button variant="ghost" size="sm" aria-label="Reset" className="flex-1">
        reset
      </Button>
    </div>
  )
}
