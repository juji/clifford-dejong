/**
 * Clifford-deJong Attractor Mobile App
 *
 * @format
 */

import React from 'react';
import {
  ScrollView,
  StatusBar,
  Text,
  useColorScheme,
  View,
} from 'react-native';

// Import using path aliases
import { AppTheme } from '@/types';
import { getThemeStyles } from '@/components/styles';
import StoreTest from '@/components/store-test';
import { TestComponent } from '@/components/test-component';

function Main() {
  const isDarkMode = useColorScheme() === 'dark';
  const theme: AppTheme = isDarkMode ? 'dark' : 'light';
  const styles = getThemeStyles(isDarkMode);

  return (
    <View className="flex-1 bg-background-light dark:bg-background-dark">
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
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
          These attractors are known for their intricate, fractal-like
          structures that emerge from simple mathematical rules.
        </Text>

        <Text className="text-base leading-6 mb-2 text-gray-600 dark:text-gray-400">
          This React Native app features automatic theme detection that responds
          to your device's system preferences. The interface seamlessly
          transitions between light and dark modes, ensuring optimal viewing
          comfort in any lighting condition.
        </Text>

        <Text className="text-base leading-6 mb-2 text-gray-600 dark:text-gray-400">
          TypeScript path aliases are working perfectly, enabling clean imports
          and better code organization. The app utilizes modern React Native
          development practices with full TypeScript support for enhanced
          developer experience.
        </Text>

        <Text className="text-base leading-6 mb-2 text-gray-600 dark:text-gray-400">
          Built with performance and user experience in mind, this application
          showcases the power of mathematical beauty rendered in real-time on
          mobile devices.
        </Text>

        <Text className="text-base leading-6 mb-2 text-gray-600 dark:text-gray-400">
          The mathematical foundation of this attractor lies in a system of
          discrete dynamical equations that produce chaotic behavior. Each point
          is calculated based on the previous point's coordinates, creating an
          endless dance of mathematical precision that never repeats exactly.
        </Text>

        <Text className="text-base leading-6 mb-2 text-gray-600 dark:text-gray-400">
          Strange attractors like the Clifford-deJong have applications in
          various fields including chaos theory, complex systems analysis, and
          computational art. They demonstrate how simple mathematical rules can
          generate infinitely complex and beautiful patterns.
        </Text>

        <Text className="text-base leading-6 mb-2 text-gray-600 dark:text-gray-400">
          This mobile implementation leverages React Native's cross-platform
          capabilities, ensuring consistent performance across both iOS and
          Android devices. The app architecture follows modern React patterns
          with hooks and functional components for optimal maintainability.
        </Text>

        <Text className="text-base leading-6 mb-2 text-gray-600 dark:text-gray-400">
          The color palette adapts intelligently to your device's appearance
          settings, providing high contrast ratios for accessibility and
          reducing eye strain during extended viewing sessions. The transition
          between themes is smooth and immediate.
        </Text>

        <Text className="text-base leading-6 mb-2 text-gray-600 dark:text-gray-400">
          Future updates will include interactive controls for adjusting
          attractor parameters, color customization options, animation speed
          controls, and the ability to save your favorite configurations for
          later exploration.
        </Text>

        <Text className="text-base leading-6 mb-2 text-gray-600 dark:text-gray-400">
          Experience the mesmerizing world of mathematical art through this
          carefully crafted mobile application that brings complex mathematical
          concepts to your fingertips in an intuitive and visually stunning
          interface.
        </Text>

        <View style={styles.divider} />

        <StoreTest />
      </ScrollView>
    </View>
  );
}

export default Main;
