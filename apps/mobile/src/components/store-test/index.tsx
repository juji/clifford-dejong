/**
 * A component to test the Zustand store functionality
 * This component allows users to modify attractor parameters and see persistence working
 * Updates are made directly to the Zustand store without local state
 */

import React from 'react';
import { Button, Switch, Alert, StyleSheet } from 'react-native';
import { View, Text } from 'react-native';
import Slider from '@react-native-community/slider';
import { useAttractorStore, isReactNativeCheck } from '../../store';

const StoreTest: React.FC = () => {
  const { attractorParameters, setAttractorParams, reset } =
    useAttractorStore();

  // Environment detection is a constant as it won't change during the component lifecycle
  const isRNDetected = isReactNativeCheck();

  // Helper function to update a single parameter
  const updateParam = (param: string, value: number) => {
    setAttractorParams({
      ...attractorParameters,
      [param]: value,
    });
  };

  // Update attractor type
  const updateType = (isClifford: boolean) => {
    setAttractorParams({
      ...attractorParameters,
      attractor: isClifford ? 'clifford' : 'dejong',
    });
  };

  // Show save confirmation
  const showSaveConfirmation = () => {
    Alert.alert(
      'Parameters Saved',
      'Your parameters have been saved and will persist across app restarts.',
      [{ text: 'OK' }],
    );
  };

  return (
    <View className="p-4 bg-white dark:bg-gray-900">
      <Text className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
        Attractor Store Test
      </Text>

      <Text className="text-lg font-bold mt-4 mb-2 text-gray-800 dark:text-gray-200">
        Environment Detection
      </Text>
      <Text className="text-base mb-2 text-gray-700 dark:text-gray-300">
        React Native detected: {isRNDetected ? 'Yes ✅' : 'No ❌'}
      </Text>
      <Text className="text-base mb-2 text-gray-700 dark:text-gray-300">
        Current attractor: {attractorParameters.attractor}
      </Text>

      <View className="my-4">
        <Text className="text-lg font-bold mt-4 mb-2 text-gray-800 dark:text-gray-200">
          Parameters
        </Text>

        <View className="mb-4">
          <Text className="text-base mb-1 text-gray-700 dark:text-gray-300">
            Type:
          </Text>
          <View className="flex-row items-center justify-between w-40">
            <Text className="text-gray-700 dark:text-gray-300">DeJong</Text>
            <Switch
              value={attractorParameters.attractor === 'clifford'}
              onValueChange={isClifford => updateType(isClifford)}
            />
            <Text className="text-gray-700 dark:text-gray-300">Clifford</Text>
          </View>
        </View>

        <View className="mb-4">
          <Text className="text-base mb-1 text-gray-700 dark:text-gray-300">
            Parameter A: {attractorParameters.a.toFixed(2)}
          </Text>
          <Slider
            className="w-full h-10"
            minimumValue={-3}
            maximumValue={3}
            step={0.01}
            value={attractorParameters.a}
            onValueChange={value => updateParam('a', value)}
          />
        </View>

        <View className="mb-4">
          <Text className="text-base mb-1 text-gray-700 dark:text-gray-300">
            Parameter B: {attractorParameters.b.toFixed(2)}
          </Text>
          <Slider
            className="w-full h-10"
            minimumValue={-3}
            maximumValue={3}
            step={0.01}
            value={attractorParameters.b}
            onValueChange={value => updateParam('b', value)}
          />
        </View>

        <View className="mb-4">
          <Text className="text-base mb-1 text-gray-700 dark:text-gray-300">
            Parameter C: {attractorParameters.c.toFixed(2)}
          </Text>
          <Slider
            className="w-full h-10"
            minimumValue={-3}
            maximumValue={3}
            step={0.01}
            value={attractorParameters.c}
            onValueChange={value => updateParam('c', value)}
          />
        </View>

        <View className="mb-4">
          <Text className="text-base mb-1 text-gray-700 dark:text-gray-300">
            Parameter D: {attractorParameters.d.toFixed(2)}
          </Text>
          <Slider
            className="w-full h-10"
            minimumValue={-3}
            maximumValue={3}
            step={0.01}
            value={attractorParameters.d}
            onValueChange={value => updateParam('d', value)}
          />
        </View>
      </View>

      <View className="flex-row my-4">
        <Button title="Save Parameters" onPress={showSaveConfirmation} />
        <View className="w-4" />
        <Button title="Reset to Default" onPress={reset} color="#FF6B6B" />
      </View>

      <View className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg mt-4">
        <Text className="text-lg font-bold mb-2 text-gray-800 dark:text-gray-200">
          Current Store State:
        </Text>
        <Text className="text-base text-gray-700 dark:text-gray-300">
          Type: {attractorParameters.attractor}
          {'\n'}
          A: {attractorParameters.a.toFixed(2)}
          {'\n'}
          B: {attractorParameters.b.toFixed(2)}
          {'\n'}
          C: {attractorParameters.c.toFixed(2)}
          {'\n'}
          D: {attractorParameters.d.toFixed(2)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subheading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
    marginBottom: 8,
  },
  section: {
    marginVertical: 16,
  },
  paramContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 4,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 150,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginVertical: 16,
  },
  buttonSpacer: {
    width: 16,
  },
  currentState: {
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginTop: 16,
  },
});

export default StoreTest;
