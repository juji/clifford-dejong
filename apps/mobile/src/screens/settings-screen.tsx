/**
 * Settings Screen for Clifford-deJong Attractor Mobile App
 *
 * @format
 */

import React from 'react';
import { ScrollView, Text, useColorScheme, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

// Import using path aliases
import { AppTheme } from '@/types';
import { getThemeStyles } from '@/components/styles';
import { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

function SettingsScreen({ navigation }: Props) {
  const isDarkMode = useColorScheme() === 'dark';
  const theme: AppTheme = isDarkMode ? 'dark' : 'light';
  const styles = getThemeStyles(isDarkMode);

  return (
    <ScrollView className="p-4">
      <Text className="text-2xl font-bold mb-4 mt-14 text-text-light dark:text-text-dark">
        Settings
      </Text>

      <Text className="text-base leading-6 mb-4 text-gray-600 dark:text-gray-400">
        Customize your Clifford-deJong Attractor experience.
      </Text>

      <Text className="text-base leading-6 mb-2 text-gray-600 dark:text-gray-400">
        Future updates will include interactive controls for adjusting attractor
        parameters, color customization options, animation speed controls, and
        the ability to save your favorite configurations for later exploration.
      </Text>

      <Text className="text-base leading-6 mb-2 text-gray-600 dark:text-gray-400">
        The color palette adapts intelligently to your device's appearance
        settings, providing high contrast ratios for accessibility and reducing
        eye strain during extended viewing sessions. The transition between
        themes is smooth and immediate.
      </Text>

      {/* Placeholder for settings controls */}
      <View className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg mb-4">
        <Text className="text-gray-800 dark:text-gray-200 font-medium mb-2">
          Theme Mode
        </Text>
        <Text className="text-gray-600 dark:text-gray-400">
          Current: {theme} (follows system)
        </Text>
      </View>

      <View style={styles.divider} />
    </ScrollView>
  );
}

export default SettingsScreen;
