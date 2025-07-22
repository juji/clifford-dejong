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

function Main() {
  const isDarkMode = useColorScheme() === 'dark';
  const theme: AppTheme = isDarkMode ? 'dark' : 'light';
  const styles = getThemeStyles(isDarkMode);

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ScrollView style={styles.scrollContainer}>
        <Text style={styles.heading}>Clifford-deJong Attractor</Text>
        <Text style={styles.paragraph}>Current theme: {theme}</Text>

        <Text style={styles.paragraph}>
          Welcome to the Clifford-deJong Attractor mobile application! This app
          demonstrates beautiful mathematical visualizations based on the famous
          strange attractor discovered by Clifford Pickover and Peter de Jong.
        </Text>

        <Text style={styles.paragraph}>
          The Clifford-deJong attractor is a type of strange attractor that
          creates mesmerizing patterns through iterative mathematical equations.
          These attractors are known for their intricate, fractal-like
          structures that emerge from simple mathematical rules.
        </Text>

        <Text style={styles.paragraph}>
          This React Native app features automatic theme detection that responds
          to your device's system preferences. The interface seamlessly
          transitions between light and dark modes, ensuring optimal viewing
          comfort in any lighting condition.
        </Text>

        <Text style={styles.paragraph}>
          TypeScript path aliases are working perfectly, enabling clean imports
          and better code organization. The app utilizes modern React Native
          development practices with full TypeScript support for enhanced
          developer experience.
        </Text>

        <Text style={styles.paragraph}>
          Built with performance and user experience in mind, this application
          showcases the power of mathematical beauty rendered in real-time on
          mobile devices.
        </Text>

        <Text style={styles.paragraph}>
          The mathematical foundation of this attractor lies in a system of
          discrete dynamical equations that produce chaotic behavior. Each point
          is calculated based on the previous point's coordinates, creating an
          endless dance of mathematical precision that never repeats exactly.
        </Text>

        <Text style={styles.paragraph}>
          Strange attractors like the Clifford-deJong have applications in
          various fields including chaos theory, complex systems analysis, and
          computational art. They demonstrate how simple mathematical rules can
          generate infinitely complex and beautiful patterns.
        </Text>

        <Text style={styles.paragraph}>
          This mobile implementation leverages React Native's cross-platform
          capabilities, ensuring consistent performance across both iOS and
          Android devices. The app architecture follows modern React patterns
          with hooks and functional components for optimal maintainability.
        </Text>

        <Text style={styles.paragraph}>
          The color palette adapts intelligently to your device's appearance
          settings, providing high contrast ratios for accessibility and
          reducing eye strain during extended viewing sessions. The transition
          between themes is smooth and immediate.
        </Text>

        <Text style={styles.paragraph}>
          Future updates will include interactive controls for adjusting
          attractor parameters, color customization options, animation speed
          controls, and the ability to save your favorite configurations for
          later exploration.
        </Text>

        <Text style={styles.paragraph}>
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
