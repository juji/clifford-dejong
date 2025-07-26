import React from 'react';
import { TouchableOpacity, useColorScheme } from 'react-native';
import LucideIcon from '@react-native-vector-icons/lucide';
import clsx from 'clsx';

const MainMenuButton = ({ onPress }: { onPress?: () => void }) => {
  const isDark = useColorScheme() === 'dark';
  return (
    <TouchableOpacity
      className={clsx(
        `absolute bottom-8 right-6 dark:bg-zinc-900 bg-zinc-100
        border-zinc-500 dark:border-zinc-300
        border-2 rounded-full w-14 h-14 items-center 
        justify-center shadow-lg`,
      )}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <LucideIcon name="menu" color={isDark ? '#fff' : '#222'} size={24} />
    </TouchableOpacity>
  );
};

export default MainMenuButton;
