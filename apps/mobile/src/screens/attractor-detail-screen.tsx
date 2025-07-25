/**
 * Attractor Detail Screen for Clifford-deJong Attractor Mobile App
 *
 * @format
 */

import React from 'react';
import { ScrollView, Text, View, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'AttractorDetail'>;

function AttractorDetailScreen({ navigation, route }: Props) {
  const { id } = route.params;

  return (
    <ScrollView className="p-4 flex-1">
      <View className="mt-4 mb-6">
        <Text className="text-xl font-bold mb-4 text-text-light dark:text-text-dark">
          Attractor Detail: {id}
        </Text>

        <View className="h-60 mb-4 bg-gray-200 dark:bg-gray-700 rounded-lg items-center justify-center">
          <Text className="text-base text-gray-600 dark:text-gray-400">
            Attractor Visualization Placeholder
          </Text>
        </View>

        <Text className="text-base mb-4 text-gray-600 dark:text-gray-400">
          This screen shows the details of a specific attractor configuration.
          In a complete implementation, this would display the actual attractor
          visualization and provide controls to adjust its parameters.
        </Text>

        <View className="flex flex-row mt-4 space-x-2">
          <Pressable
            className="flex-1 p-3 bg-blue-100 dark:bg-blue-900 rounded-lg items-center"
            onPress={() => navigation.goBack()}
          >
            <Text className="text-blue-800 dark:text-blue-200 font-medium">
              Go Back
            </Text>
          </Pressable>

          <Pressable
            className="flex-1 p-3 bg-purple-100 dark:bg-purple-900 rounded-lg items-center"
            onPress={() => navigation.navigate('AttractorScreen')}
          >
            <Text className="text-purple-800 dark:text-purple-200 font-medium">
              All Attractors
            </Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

export default AttractorDetailScreen;
