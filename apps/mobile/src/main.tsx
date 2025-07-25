/**
 * Clifford-deJong Attractor Mobile App
 *
 * @format
 */

import React from 'react';
import {
  StatusBar,
  useColorScheme,
  View,
  SafeAreaView,
  // Text
} from 'react-native';

// Import using path aliases
// import { AppTheme } from '@/types';
import AppNavigator from '@/navigation/app-navigator';

function Main() {
  const isDarkMode = useColorScheme() === 'dark';
  // const theme: AppTheme = isDarkMode ? 'dark' : 'light';

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View className="flex-1">
        <AppNavigator />
      </View>
    </SafeAreaView>
  );
}

export default Main;
