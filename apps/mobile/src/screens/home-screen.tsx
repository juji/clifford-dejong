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
import { AttractorCanvas } from '@/components/attractor-canvas';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

function HomeScreen({ navigation }: Props) {
  const isDarkMode = useColorScheme() === 'dark';
  const theme: AppTheme = isDarkMode ? 'dark' : 'light';
  const styles = getThemeStyles(isDarkMode);

  return (
    <View style={{ flex: 1 }}>
      <AttractorCanvas />
      <MainMenuButton />
      <MainMenu />
    </View>
  );
}

export default HomeScreen;
