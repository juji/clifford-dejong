import React from 'react';
import { TouchableOpacity } from 'react-native';
import LucideIcon from '@react-native-vector-icons/lucide';
import clsx from 'clsx';

const MainMenuButton = ({ onPress }: { onPress?: () => void }) => (
  <TouchableOpacity
    className={clsx(
      `absolute bottom-8 left-6 bg-zinc-900 
      rounded-full w-14 h-14 items-center 
      justify-center shadow-lg`,
    )}
    activeOpacity={0.8}
    onPress={onPress}
  >
    <LucideIcon name="menu" color="#fff" size={18} />
  </TouchableOpacity>
);

export default MainMenuButton;
