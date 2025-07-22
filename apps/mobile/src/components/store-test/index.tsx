/**
 * A component to test the Zustand store functionality
 * This component allows users to modify attractor parameters and see persistence working
 * Updates are made directly to the Zustand store without local state
 */

import React from 'react';
import { View, Text, Button, Switch, StyleSheet, Alert } from 'react-native';
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
    <View style={styles.container}>
      <Text style={styles.heading}>Attractor Store Test</Text>

      <Text style={styles.subheading}>Environment Detection</Text>
      <Text style={styles.text}>
        React Native detected: {isRNDetected ? 'Yes ✅' : 'No ❌'}
      </Text>
      <Text style={styles.text}>
        Current attractor: {attractorParameters.attractor}
      </Text>

      <View style={styles.section}>
        <Text style={styles.subheading}>Parameters</Text>

        <View style={styles.paramContainer}>
          <Text style={styles.label}>Type:</Text>
          <View style={styles.switchContainer}>
            <Text>DeJong</Text>
            <Switch
              value={attractorParameters.attractor === 'clifford'}
              onValueChange={isClifford => updateType(isClifford)}
            />
            <Text>Clifford</Text>
          </View>
        </View>

        <View style={styles.paramContainer}>
          <Text style={styles.label}>
            Parameter A: {attractorParameters.a.toFixed(2)}
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={-3}
            maximumValue={3}
            step={0.01}
            value={attractorParameters.a}
            onValueChange={value => updateParam('a', value)}
          />
        </View>

        <View style={styles.paramContainer}>
          <Text style={styles.label}>
            Parameter B: {attractorParameters.b.toFixed(2)}
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={-3}
            maximumValue={3}
            step={0.01}
            value={attractorParameters.b}
            onValueChange={value => updateParam('b', value)}
          />
        </View>

        <View style={styles.paramContainer}>
          <Text style={styles.label}>
            Parameter C: {attractorParameters.c.toFixed(2)}
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={-3}
            maximumValue={3}
            step={0.01}
            value={attractorParameters.c}
            onValueChange={value => updateParam('c', value)}
          />
        </View>

        <View style={styles.paramContainer}>
          <Text style={styles.label}>
            Parameter D: {attractorParameters.d.toFixed(2)}
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={-3}
            maximumValue={3}
            step={0.01}
            value={attractorParameters.d}
            onValueChange={value => updateParam('d', value)}
          />
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Save Parameters" onPress={showSaveConfirmation} />
        <View style={styles.buttonSpacer} />
        <Button title="Reset to Default" onPress={reset} color="#FF6B6B" />
      </View>

      <View style={styles.currentState}>
        <Text style={styles.subheading}>Current Store State:</Text>
        <Text style={styles.text}>
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
