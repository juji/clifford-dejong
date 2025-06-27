"use client";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import * as React from "react";

export function DarkModeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div
      className={
        `absolute top-4 right-4 z-[200] rounded-lg p-1 transition-colors ` +
        (isDark ?  "bg-black/10" : "bg-white/90")
      }
    >
      <Button
        size="icon"
        aria-label="Toggle dark mode"
        onClick={() => setTheme(isDark ? "light" : "dark")}
      >
        {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        <span className="sr-only">Toggle dark mode</span>
      </Button>
    </div>
  );
}
