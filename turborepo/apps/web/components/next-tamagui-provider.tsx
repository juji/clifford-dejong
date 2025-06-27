"use client";

import "@tamagui/core/reset.css";
import "@tamagui/polyfill-dev";

import { ReactNode } from "react";
import { StyleSheet as RNWStyleSheet } from "react-native-web";
import { useServerInsertedHTML } from "next/navigation";
import { NextThemeProvider, useRootTheme } from "@tamagui/next-theme";
import { TamaguiProvider } from "tamagui";
import tamaguiConfig from "../tamagui.config";

export const NextTamaguiProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useRootTheme();

  useServerInsertedHTML(() => {
    // @ts-expect-error Tamagui SSR: react-native-web StyleSheet.getSheet() is not typed for Next.js SSR
    const rnwStyle = RNWStyleSheet.getSheet();
    return (
      <>
        <style
          dangerouslySetInnerHTML={{ __html: rnwStyle.textContent }}
          id={rnwStyle.id}
        />
        <style
          dangerouslySetInnerHTML={{ __html: tamaguiConfig.getNewCSS() }}
        />
      </>
    );
  });

  return (
    <NextThemeProvider
      skipNextHead
      onChangeTheme={setTheme as (theme: string) => void}
      disableTransitionOnChange
      enableSystem
    >
      <TamaguiProvider config={tamaguiConfig} defaultTheme={theme}>
        {children}
      </TamaguiProvider>
    </NextThemeProvider>
  );
};
