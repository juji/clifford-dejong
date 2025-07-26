import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';

const FabSettingsButton = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <TouchableOpacity
      className="absolute bottom-8 left-6 bg-zinc-900 rounded-full w-14 h-14 items-center justify-center shadow-lg"
      onPress={() => navigation.navigate('Settings')}
      activeOpacity={0.8}
    >
      <Text className="text-white text-2xl">⚙️</Text>
    </TouchableOpacity>
  );
};

export default FabSettingsButton;
