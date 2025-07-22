/**
 * A component to test the Zustand store functionality
 * This component allows users to modify attractor parameters and see persistence working
 */

import React, { useState } from 'react';
import { View, Text, Button, Switch, StyleSheet, Alert } from 'react-native';
import Slider from '@react-native-community/slider';
import { useAttractorStore, isReactNativeCheck } from '../../store';

const StoreTest: React.FC = () => {
  const { attractorParameters, setAttractorParams, reset } =
    useAttractorStore();
  const [isRNDetected, setIsRNDetected] = useState(isReactNativeCheck());

  // Local state for parameter values
  const [paramA, setParamA] = useState(attractorParameters.a);
  const [paramB, setParamB] = useState(attractorParameters.b);
  const [paramC, setParamC] = useState(attractorParameters.c);
  const [paramD, setParamD] = useState(attractorParameters.d);
  const [type, setType] = useState(
    attractorParameters.attractor === 'clifford',
  );

  // Apply changes to the store
  const applyChanges = () => {
    setAttractorParams({
      ...attractorParameters,
      a: paramA,
      b: paramB,
      c: paramC,
      d: paramD,
      attractor: type ? 'clifford' : 'dejong',
    });

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
            <Switch value={type} onValueChange={setType} />
            <Text>Clifford</Text>
          </View>
        </View>

        <View style={styles.paramContainer}>
          <Text style={styles.label}>Parameter A: {paramA.toFixed(2)}</Text>
          <Slider
            style={styles.slider}
            minimumValue={-3}
            maximumValue={3}
            step={0.01}
            value={paramA}
            onValueChange={setParamA}
          />
        </View>

        <View style={styles.paramContainer}>
          <Text style={styles.label}>Parameter B: {paramB.toFixed(2)}</Text>
          <Slider
            style={styles.slider}
            minimumValue={-3}
            maximumValue={3}
            step={0.01}
            value={paramB}
            onValueChange={setParamB}
          />
        </View>

        <View style={styles.paramContainer}>
          <Text style={styles.label}>Parameter C: {paramC.toFixed(2)}</Text>
          <Slider
            style={styles.slider}
            minimumValue={-3}
            maximumValue={3}
            step={0.01}
            value={paramC}
            onValueChange={setParamC}
          />
        </View>

        <View style={styles.paramContainer}>
          <Text style={styles.label}>Parameter D: {paramD.toFixed(2)}</Text>
          <Slider
            style={styles.slider}
            minimumValue={-3}
            maximumValue={3}
            step={0.01}
            value={paramD}
            onValueChange={setParamD}
          />
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Save Parameters" onPress={applyChanges} />
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
