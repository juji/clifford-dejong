/**
 * Home Screen for Clifford-deJong Attractor Mobile App
 *
 * @format
 */

import { View } from 'react-native';
import MainMenuButton from '@/components/main-menu-button';
import { MainMenu } from '@/components/main-menu';
import { AttractorCanvas } from '@/components/attractor-canvas';

function HomeScreen() {
  return (
    <View style={{ flex: 1 }}>
      <AttractorCanvas />
      <MainMenuButton />
      <MainMenu />
    </View>
  );
}

export default HomeScreen;
