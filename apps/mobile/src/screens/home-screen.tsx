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
import MainMenuButton from '@/components/main-menu-button';
import { MainMenu } from '@/components/main-menu';
import { RootStackParamList } from '@/navigation/types';
import { Button } from 'tamagui';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

function HomeScreen({ navigation }: Props) {
  const isDarkMode = useColorScheme() === 'dark';
  const theme: AppTheme = isDarkMode ? 'dark' : 'light';
  const styles = getThemeStyles(isDarkMode);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView className="p-4 flex-1">
        <Button
          onPress={() => navigation.navigate('TamaguiShowcase')}
          size="$4"
          mb="$4"
        >
          Tamagui Showcase
        </Button>
        <Text className="text-2xl font-bold mb-4 mt-4 text-text-light dark:text-text-dark">
          Clifford-deJong Attractor
        </Text>
        <Text className="text-base mb-4 text-gray-600 dark:text-gray-400">
          Current theme: {theme}
        </Text>

        <Text className="text-base leading-6 mb-2 text-gray-600 dark:text-gray-400">
          Welcome to the Clifford-deJong Attractor mobile application! This app
          demonstrates beautiful mathematical visualizations based on the famous
          strange attractor discovered by Clifford Pickover and Peter de Jong.
        </Text>

        <Text className="text-base leading-6 mb-4 text-gray-600 dark:text-gray-400">
          The Clifford-deJong attractor is a type of strange attractor that
          creates mesmerizing patterns through iterative mathematical equations.
          These attractors are known for their intricate, fractal-like
          structures that emerge from simple mathematical rules.
        </Text>

        {/* Navigation Buttons */}
        <View className="mt-6 mb-6 flex flex-col space-y-4">
          <View
            testID="AttractorScreenButton"
            className="p-4 bg-blue-100 dark:bg-blue-900 rounded-lg items-center"
            onTouchEnd={() => navigation.navigate('AttractorScreen')}
          >
            <Text className="text-lg font-bold text-blue-800 dark:text-blue-200">
              Explore Attractor Visualization
            </Text>
          </View>

          <View
            className="p-4 bg-green-100 dark:bg-green-900 rounded-lg items-center"
            onTouchEnd={() =>
              navigation.navigate('AttractorDetail', { id: 'default' })
            }
          >
            <Text className="text-lg font-bold text-green-800 dark:text-green-200">
              View Default Attractor
            </Text>
          </View>

          <View
            className="p-4 bg-purple-100 dark:bg-purple-900 rounded-lg items-center"
            onTouchEnd={() => navigation.navigate('Settings')}
          >
            <Text className="text-lg font-bold text-purple-800 dark:text-purple-200">
              Settings
            </Text>
          </View>
        </View>

        <View style={styles.divider} />
      </ScrollView>
      <MainMenuButton />
      <MainMenu />
    </View>
  );
}

export default HomeScreen;
