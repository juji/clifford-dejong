/**
 * App Navigator for Clifford-deJong Attractor Mobile App
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, useColorScheme, View } from 'react-native';

// Import screens
import HomeScreen from '@/screens/home-screen';
import AttractorScreen from '@/screens/attractor-screen';
import SettingsScreen from '@/screens/settings-screen';

// Import types
import { BottomTabParamList } from './types';

// Import default theme for NavigationContainer
import { DefaultTheme, DarkTheme } from '@react-navigation/native';

const Tab = createBottomTabNavigator<BottomTabParamList>();

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
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: isDarkMode ? '#8EB8E5' : '#3366BB',
          tabBarInactiveTintColor: isDarkMode ? '#71717A' : '#A1A1AA',
          tabBarStyle: {
            backgroundColor: isDarkMode ? '#121212' : '#FFFFFF',
            borderTopColor: isDarkMode ? '#27272A' : '#E4E4E7',
          },
          headerShown: false,
          tabBarBackground: () => (
            <View className="flex-1 bg-background-light dark:bg-background-dark" />
          ),
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarIcon: ({ color }: { color: string }) => (
              <Text style={{ color, fontSize: 20 }}>🏠</Text>
            ),
          }}
        />
        <Tab.Screen
          name="Attractor"
          component={AttractorScreen}
          options={{
            tabBarIcon: ({ color }: { color: string }) => (
              <Text style={{ color, fontSize: 20 }}>🔮</Text>
            ),
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            tabBarIcon: ({ color }: { color: string }) => (
              <Text style={{ color, fontSize: 20 }}>⚙️</Text>
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default AppNavigator;
