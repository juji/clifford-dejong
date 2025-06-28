import React from "react";

import { cn } from "@/lib/utils"

export function Footer() {
  return (
     <footer className={cn(`
        fixed inset-x-0 bottom-0 w-full 
        glass
        text-black/70 dark:text-white/70
        py-3 px-4 text-[0.8rem] font-light border-t 
        z-[100] text-left border-0
        before:content-[''] before:absolute 
        before:top-[0px] before:h-[1px] 
        before:width-full
        before:left-0 before:right-0
        before:bg-gradient-to-r
        before:from-[#343434cf] before:to-[#ffffff63]
      `)}>
      <span>Clifford-de Jong Attractor &copy; {new Date().getFullYear()}</span>
    </footer>
  );
}
