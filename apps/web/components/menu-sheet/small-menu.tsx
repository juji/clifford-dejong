import { useUIStore } from "@/store/ui-store"
import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

export function SmallMenu({ className }: { className?: string }) {

  const menuOpen = useUIStore((s) => s.menuOpen)
  const setMenuOpen = useUIStore((s) => s.setMenuOpen)
  
  const [ isOpen, setIsOpen ] = useState(menuOpen);
  const setMenuOpenRef = useRef<null|ReturnType<typeof setTimeout>>(null);
  useEffect(() => {
    if(setMenuOpenRef.current) clearTimeout(setMenuOpenRef.current);
    if(menuOpen && !isOpen) setIsOpen(true)
    else if(!menuOpen && isOpen){
      setMenuOpenRef.current = setTimeout(() => { setIsOpen(false) },300)
    }

    return () => {
      if(setMenuOpenRef.current) clearTimeout(setMenuOpenRef.current);
    }
  }, [menuOpen, isOpen])

  return isOpen ? (
    <div 
      className={cn("fixed bottom-0 left-0 z-[200] w-full h-full", className)}>
      <div onClick={() => setMenuOpen(!menuOpen)}
        className={cn(`w-full h-full fixed bottom-0 left-0 z-[201]`)}></div>
      <div 
        className={cn(`
          fixed bottom-[42px] left-0 z-[202] w-full grid
        `)}>

          <div data-state={menuOpen ? 'open' : 'closed'}
          >left</div>
          <div data-state={menuOpen ? 'open' : 'closed'}
          >right</div>
      </div>
    </div>
  ) : null

}