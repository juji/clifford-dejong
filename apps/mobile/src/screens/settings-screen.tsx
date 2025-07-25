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
    <ScrollView className="p-4 flex-1">
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

      {/* Settings options */}
      <View className="mt-4 space-y-3 mb-6">
        <View className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <Text className="text-gray-800 dark:text-gray-200 font-medium mb-2">
            Theme Mode
          </Text>
          <Text className="text-gray-600 dark:text-gray-400">
            Current: {theme} (follows system)
          </Text>
        </View>

        <View className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <Text className="text-gray-800 dark:text-gray-200 font-medium mb-2">
            Quality
          </Text>
          <Text className="text-gray-600 dark:text-gray-400">
            Current: High (10,000 points)
          </Text>
        </View>

        <View className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <Text className="text-gray-800 dark:text-gray-200 font-medium mb-2">
            Animation Speed
          </Text>
          <Text className="text-gray-600 dark:text-gray-400">
            Current: Medium
          </Text>
        </View>
      </View>

      {/* Navigation buttons */}
      <View className="my-4 flex-row space-x-2">
        <View
          className="flex-1 p-3 bg-blue-100 dark:bg-blue-900 rounded-lg items-center"
          onTouchEnd={() => navigation.navigate('Home')}
        >
          <Text className="text-blue-800 dark:text-blue-200 font-medium">
            Back to Home
          </Text>
        </View>

        <View
          className="flex-1 p-3 bg-green-100 dark:bg-green-900 rounded-lg items-center"
          onTouchEnd={() => navigation.navigate('AttractorScreen')}
        >
          <Text className="text-green-800 dark:text-green-200 font-medium">
            View Attractors
          </Text>
        </View>
      </View>

      <View style={styles.divider} />
    </ScrollView>
  );
}

export default SettingsScreen;
