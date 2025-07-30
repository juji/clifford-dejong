/**
 * Attractor Screen for Clifford-deJong Attractor Mobile App
 *
 * @format
 */

import React from 'react';
import { ScrollView, Text, useColorScheme, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

// Import using path aliases
import { AppTheme } from '@/types';
import { getThemeStyles } from '@/components/styles';
import StoreTest from '@/components/store-test';
import { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'AttractorScreen'>;

function AttractorScreen({ navigation }: Props) {
  const isDarkMode = useColorScheme() === 'dark';
  // const theme: AppTheme = isDarkMode ? 'dark' : 'light';
  const styles = getThemeStyles(isDarkMode);

  return (
    <ScrollView className="p-4 flex-1">
      <Text className="text-2xl font-bold mb-4 mt-14 text-text-light dark:text-text-dark">
        Attractor Visualization
      </Text>

      <Text className="text-base leading-6 mb-4 text-gray-600 dark:text-gray-400">
        This screen will contain the interactive visualization of the
        Clifford-deJong attractor.
      </Text>

      <Text className="text-base leading-6 mb-2 text-gray-600 dark:text-gray-400">
        The mathematical foundation of this attractor lies in a system of
        discrete dynamical equations that produce chaotic behavior. Each point
        is calculated based on the previous point's coordinates, creating an
        endless dance of mathematical precision that never repeats exactly.
      </Text>

      <Text className="text-base leading-6 mb-2 text-gray-600 dark:text-gray-400">
        Strange attractors like the Clifford-deJong have applications in various
        fields including chaos theory, complex systems analysis, and
        computational art. They demonstrate how simple mathematical rules can
        generate infinitely complex and beautiful patterns.
      </Text>

      {/* Placeholder for the actual visualization */}
      <View className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg mb-4 items-center justify-center">
        <Text className="text-gray-500 dark:text-gray-400">
          Attractor visualization will appear here
        </Text>
      </View>

      {/* Sample attractors list */}
      <Text className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">
        Sample Attractors:
      </Text>

      <View className="flex flex-col space-y-3 mb-6">
        {['classic', 'symmetric', 'spiral', 'fractal'].map(id => (
          <View
            key={id}
            className="p-3 bg-blue-50 dark:bg-blue-900/40 rounded-lg flex-row justify-between items-center"
            onTouchEnd={() => navigation.navigate('AttractorDetail', { id })}
          >
            <Text className="text-blue-800 dark:text-blue-200 font-medium capitalize">
              {id} Attractor
            </Text>
            <Text className="text-gray-500 dark:text-gray-400">→</Text>
          </View>
        ))}
      </View>

      <View className="mt-6 mb-6">
        <Text className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">
          Store Test:
        </Text>
        <StoreTest />
      </View>

      <View style={styles.divider} />
    </ScrollView>
  );
}

export default AttractorScreen;
