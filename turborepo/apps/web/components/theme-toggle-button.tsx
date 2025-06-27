"use client";
import { Button } from "tamagui";
import { Sun, Moon } from "lucide-react";
import { useThemeSetting, useRootTheme } from "@tamagui/next-theme";

export default function ThemeToggleButton() {
  const themeSetting = useThemeSetting();
  const [theme] = useRootTheme();
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
      onPress={themeSetting.toggle}
    >
      {theme === "dark" ? <Moon size={20} /> : <Sun size={20} />}
    </Button>
  );
}
