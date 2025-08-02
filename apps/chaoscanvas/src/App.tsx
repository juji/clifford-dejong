import * as React from 'react';
import { useColorScheme, StatusBar } from 'react-native';
import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { TamaguiProvider, View } from '@tamagui/core';
import { config } from './tamagui.config'; // your configuration
import { Navigation } from './lib/navigation';

export default function App() {
  const isDarkMode = useColorScheme() === 'dark';

  // Customize navigation theme
  const navigationTheme = isDarkMode ? DarkTheme : DefaultTheme;

  return (
    <TamaguiProvider
      config={config}
      defaultTheme={isDarkMode ? 'dark' : 'light'}
    >
      <View style={{ flex: 1 }}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <Navigation theme={navigationTheme} />
      </View>
    </TamaguiProvider>
  );
}
