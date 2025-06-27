"use client";
import { Button } from "tamagui";
import { Sun, Moon } from "lucide-react";
import { useThemeSetting, useRootTheme } from "@tamagui/next-theme";
import { useEffect, useState } from "react";

export default function ThemeToggleButton() {
  const themeSetting = useThemeSetting();
  const [theme] = useRootTheme();

  const [draw, setDraw] = useState(false);

  // This is a workaround for the Next.js hydration issue with Tamagui themes
  // It ensures that the theme is set correctly on the client side
  useEffect(() => {
    if (typeof window !== "undefined") {
      setDraw(true);
    }
  }, []);

  return draw ? (
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
  ) : null;
}
