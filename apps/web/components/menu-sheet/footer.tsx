import { Button } from "../ui/button"
import { Bolt } from "lucide-react"

interface MenuSheetFooterProps {
  footerHeight: string
}

export function MenuSheetFooter({ footerHeight }: MenuSheetFooterProps) {
  return (
    <div
      className="p-4 border-t border-border text-muted-foreground flex justify-center items-center gap-2"
      style={{ height: footerHeight }}
    >
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
