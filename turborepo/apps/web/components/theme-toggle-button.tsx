"use client";
import { Button, useIsomorphicLayoutEffect } from "tamagui";
import { Sun, Moon } from "lucide-react";
import { useThemeSetting, useRootTheme } from "@tamagui/next-theme";
import { useEffect, useState } from "react";

export default function ThemeToggleButton() {
  const themeSetting = useThemeSetting();
  const [theme] = useRootTheme();

  const [clientTheme, setClientTheme] = useState<string | undefined>("light");

  useIsomorphicLayoutEffect(() => {
    setClientTheme(themeSetting.forcedTheme || themeSetting.current || theme);
  }, [themeSetting.current, themeSetting.resolvedTheme]);

  // prevent hyddration mismatch
  // this is a workaround for the Next.js hydration issue with Tamagui themes
  const [rendered, setRendered] = useState(false);
  useEffect(() => {
    setRendered(true);
  }, []);

  return rendered ? (
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
      {clientTheme === "dark" ? <Moon size={20} /> : <Sun size={20} />}
    </Button>
  ) : null;
}
