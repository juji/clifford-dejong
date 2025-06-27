"use client";
import { useState, useEffect } from "react";
import { Button } from "tamagui";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggleButton() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const handler = (e: CustomEvent) => setTheme(e.detail);
    window.addEventListener("tamagui-theme-toggle", handler as EventListener);
    return () =>
      window.removeEventListener(
        "tamagui-theme-toggle",
        handler as EventListener,
      );
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("tamagui-theme-toggle", { detail: next }),
      );
    }
  };

  return (
    <Button
      size="$3"
      chromeless
      style={{
        position: "fixed",
        top: 32,
        right: 32,
        zIndex: 1100,
      }}
      aria-label="Toggle theme"
      onPress={toggleTheme}
    >
      {theme === "dark" ? <Moon size={20} /> : <Sun size={20} />}
    </Button>
  );
}
