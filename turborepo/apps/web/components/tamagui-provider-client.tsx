"use client";
import { useState, useEffect } from "react";
import { TamaguiProvider, Theme } from "tamagui";
import config from "../tamagui.config";

function setHtmlClass(theme: "light" | "dark") {
  if (typeof document !== "undefined") {
    document.documentElement.classList.remove("t_light", "t_dark");
    document.documentElement.classList.add(
      theme === "dark" ? "t_dark" : "t_light",
    );
  }
}

export default function TamaguiProviderClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    setHtmlClass(theme);
  }, [theme]);

  useEffect(() => {
    const handler = (e: CustomEvent) => {
      setTheme(e.detail);
      setHtmlClass(e.detail);
    };
    window.addEventListener("tamagui-theme-toggle", handler as EventListener);
    return () =>
      window.removeEventListener(
        "tamagui-theme-toggle",
        handler as EventListener,
      );
  }, []);

  return (
    <TamaguiProvider config={config}>
      <Theme name={theme}>{children}</Theme>
    </TamaguiProvider>
  );
}
