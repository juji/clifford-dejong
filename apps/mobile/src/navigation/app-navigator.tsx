/**
 * App Navigator for Clifford-deJong Attractor Mobile App
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useColorScheme } from 'react-native';

// Import screens
import HomeScreen from '@/screens/home-screen';
import AttractorScreen from '@/screens/attractor-screen';
import AttractorDetailScreen from '@/screens/attractor-detail-screen';
import SettingsScreen from '@/screens/settings-screen';

// Import types
import { RootStackParamList } from './types';

// Import default theme for NavigationContainer
import { DefaultTheme, DarkTheme } from '@react-navigation/native';

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppNavigator() {
  const isDarkMode = useColorScheme() === 'dark';

  // Custom theme with transparent backgrounds to allow Tailwind classes to show through
  const customLightTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: 'transparent',
      card: 'transparent',
      text: '#000000',
    },
  };

  const customDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: 'transparent',
      card: 'transparent',
      text: '#FFFFFF',
    },
  };

  return (
    <NavigationContainer
      theme={isDarkMode ? customDarkTheme : customLightTheme}
    >
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: isDarkMode ? '#121212' : '#FFFFFF',
          },
          headerTintColor: isDarkMode ? '#FFFFFF' : '#000000',
          contentStyle: {
            backgroundColor: isDarkMode ? '#303030' : '#FFFFFF',
          },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: 'Clifford-deJong Attractor',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="AttractorScreen"
          component={AttractorScreen}
          options={{
            title: 'Attractor View',
          }}
        />
        <Stack.Screen
          name="AttractorDetail"
          component={AttractorDetailScreen}
          options={{
            title: 'Attractor Detail',
          }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            title: 'Settings',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default AppNavigator;
