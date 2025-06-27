import React from "react";

import { cn } from "@/lib/utils"

export function Footer() {
  return (
     <footer className={cn(`
        fixed inset-x-0 bottom-0 w-full 
        bg-background text-foreground/70
        py-3 px-4 text-[0.8rem] font-light border-t 
        z-[100] text-left border-foreground/20
      `)}>
      <span>Clifford-de Jong Attractor &copy; {new Date().getFullYear()}</span>
    </footer>
  );
}
