"use client";
import { useState, useEffect } from "react";
import { Button } from "tamagui";
import { useTheme } from "next-themes";

export default function ThemeToggleButton() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = (resolvedTheme || theme) === "dark";

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
      onPress={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? "🌙" : "☀️"}
    </Button>
  );
}
