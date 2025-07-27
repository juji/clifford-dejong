import { TamaguiProvider, createTamagui } from '@tamagui/core';
import { defaultConfig } from '@tamagui/config/v4';
import { useColorScheme } from 'react-native';

// you usually export this from a tamagui.config.ts file
const config = createTamagui(defaultConfig);

type Conf = typeof config;

// make imports typed
declare module '@tamagui/core' {
  interface TamaguiCustomConfig extends Conf {}
}

export function TamaguiConfig({ children }: { children: React.ReactNode }) {
  const isDarkMode = useColorScheme() === 'dark';
  return (
    <TamaguiProvider
      config={config}
      defaultTheme={isDarkMode ? 'dark' : 'light'}
    >
      {children}
    </TamaguiProvider>
  );
}
