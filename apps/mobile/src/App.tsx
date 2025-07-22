/**
 * Clifford-deJong Attractor Mobile App
 *
 * @format
 */

import React from 'react';
import { StatusBar, Text, useColorScheme, View } from 'react-native';
// NewAppScreen has an issue, so we'll use our own components
// import { NewAppScreen } from '@react-native/new-app-screen';

// Import using path aliases
import { AppTheme } from '@/types';
import { appStyles } from '@/components/styles';

// Test importing from repo packages
import type { AttractorParameters } from '@repo/core/types';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const theme: AppTheme = isDarkMode ? 'dark' : 'light';

  return (
    <View style={appStyles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <Text style={appStyles.heading}>Clifford-deJong Attractor</Text>
      <Text style={appStyles.paragraph}>Current theme: {theme}</Text>
      <Text style={appStyles.paragraph}>
        TypeScript path aliases are working!
      </Text>
    </View>
  );
}

export default App;
