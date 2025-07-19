"use client";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import * as React from "react";

export function DarkModeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const [loaded, setLoaded] = useState(false);

  // wait for the theme to be set correctly on initial load
  // prevent hydration mismatch
  useEffect(() => {
    setLoaded(true);
  }, []);

  return loaded ? (
    <div
      className={
        `fixed top-4 right-4 z-[200] rounded-lg p-1 transition-colors ` +
        (isDark ? "bg-black/10" : "bg-white/90")
      }
    >
      <Button
        size="icon"
        aria-label="Toggle dark mode"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className="outline-none focus-visible:ring-[6px] focus-visible:ring-yellow-400"
      >
        {isDark ? (
          <Sun className="h-5 w-5" data-testid="sun-icon" />
        ) : (
          <Moon className="h-5 w-5" data-testid="moon-icon" />
        )}
        <span className="sr-only">Toggle dark mode</span>
      </Button>
    </div>
  ) : null;
}
