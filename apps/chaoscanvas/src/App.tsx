import * as React from 'react';
import { useColorScheme, StatusBar } from 'react-native';
import { createStaticNavigation } from '@react-navigation/native';
import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home } from './screens/home';
import { Example } from './screens/example';
import { TamaguiProvider, View } from '@tamagui/core';
import { config } from './tamagui.config'; // your configuration

const RootStack = createNativeStackNavigator({
  screens: {
    Home: {
      screen: Home,
      options: {
        headerShown: false,
      },
    },
    Example,
  },
});

const Navigation = createStaticNavigation(RootStack);

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
