/**
 * Home Screen for Clifford-deJong Attractor Mobile App
 *
 * @format
 */

import React from 'react';
import { ScrollView, Text, useColorScheme, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

// Import using path aliases
import { AppTheme } from '@/types';
import { getThemeStyles } from '@/components/styles';
import { TestComponent } from '@/components/test-component';
import { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

function HomeScreen({ navigation }: Props) {
  const isDarkMode = useColorScheme() === 'dark';
  const theme: AppTheme = isDarkMode ? 'dark' : 'light';
  const styles = getThemeStyles(isDarkMode);

  return (
    <ScrollView className="p-4">
      <Text className="text-2xl font-bold mb-4 mt-14 text-text-light dark:text-text-dark">
        Clifford-deJong Attractor
      </Text>
      <Text className="text-base mb-2 text-gray-600 dark:text-gray-400">
        Current theme: {theme}
      </Text>

      {/* Font Size Test Component */}
      <View className="mt-6 mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <Text className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">
          Default Tailwind Font Sizes:
        </Text>
        <TestComponent />
      </View>

      <Text className="text-base leading-6 mb-2 text-gray-600 dark:text-gray-400">
        Welcome to the Clifford-deJong Attractor mobile application! This app
        demonstrates beautiful mathematical visualizations based on the famous
        strange attractor discovered by Clifford Pickover and Peter de Jong.
      </Text>

      <Text className="text-base leading-6 mb-2 text-gray-600 dark:text-gray-400">
        The Clifford-deJong attractor is a type of strange attractor that
        creates mesmerizing patterns through iterative mathematical equations.
        These attractors are known for their intricate, fractal-like structures
        that emerge from simple mathematical rules.
      </Text>

      <Text className="text-base leading-6 mb-2 text-gray-600 dark:text-gray-400">
        Tap below to explore the attractor visualization:
      </Text>

      <View
        className="mt-4 mb-6 p-4 bg-blue-100 dark:bg-blue-900 rounded-lg items-center"
        onTouchEnd={() => navigation.navigate('Attractor')}
      >
        <Text className="text-lg font-bold text-blue-800 dark:text-blue-200">
          Open Attractor Visualization
        </Text>
      </View>

      <View style={styles.divider} />
    </ScrollView>
  );
}

export default HomeScreen;
