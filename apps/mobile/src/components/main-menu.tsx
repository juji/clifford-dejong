import React, { useEffect, useState } from 'react';
import { View, useColorScheme } from 'react-native';
import { Button, AnimatePresence, View as TamaView } from 'tamagui';
import { useGlobalStore } from '@/store/global-store';
import { clsx } from 'clsx';
import { useNavigation } from '@react-navigation/native';

function MenuButton({
  onPress,
  children,
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      size={'$5'}
      animation={'bouncy'}
      style={{ marginBottom: 8 }}
      exitStyle={{
        y: -10,
        opacity: 0,
      }}
      enterStyle={{
        y: 10,
        opacity: 0,
      }}
      opacity={1}
      y={0}
      onPress={onPress}
    >
      {children}
    </Button>
  );
}

export function MainMenu() {
  const open = useGlobalStore(state => state.isMenuOpen);
  const setMenuOpen = useGlobalStore(state => state.setMenuOpen);
  const setAttractorMenuOpen = useGlobalStore(
    state => state.setAttractorMenuOpen,
  );
  const navigation = useNavigation();

  const [isOpen, setIsOpen] = useState(open);
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  useEffect(() => {
    if (open) setIsOpen(open);
  }, [open]);

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setMenuOpen(false);
      }, 300);
    }
  }, [isOpen]);

  return open ? (
    <View
      className={clsx(`
        absolute top-0 left-0 right-0 bottom-0
        flex justify-end
        p-4
        pb-8
      `)}
    >
      <AnimatePresence>
        {isOpen ? (
          <>
            <TamaView
              animation={'lazy'}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: isDarkMode ? '#000' : '#fff',
              }}
              exitStyle={{
                opacity: 0,
              }}
              enterStyle={{
                opacity: 0,
              }}
              opacity={0.6}
              onPress={() => setIsOpen(false)}
            />
            <MenuButton
              onPress={() => {
                setIsOpen(false);
                setAttractorMenuOpen(true);
              }}
            >
              Attractor Menu
            </MenuButton>
            <MenuButton
              onPress={() => {
                setIsOpen(false);
                navigation.navigate('AttractorScreen');
              }}
            >
              Attractor Screen
            </MenuButton>
            <MenuButton
              onPress={() => {
                setIsOpen(false);
                navigation.navigate('TamaguiShowcase');
              }}
            >
              Tamagui Showcase
            </MenuButton>
          </>
        ) : null}
      </AnimatePresence>
    </View>
  ) : null;
}

export default MainMenu;
