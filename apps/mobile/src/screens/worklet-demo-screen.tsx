import React, { useState } from 'react';
import { View, Text, Button } from 'react-native';
import Animated, {
  useSharedValue,
  runOnUI,
  useDerivedValue,
  runOnJS,
} from 'react-native-reanimated';

export function WorkletDemoScreen() {
  const counter = useSharedValue<number>(0);
  const [counterValue, setCounterValue] = useState(0);

  useDerivedValue(() => {
    runOnJS(setCounterValue)(counter.value);
  }, [counter]);

  const incrementWorklet = () => {
    'worklet';
    counter.value = counter.value + 1;
  };

  const handleIncrement = () => {
    console.log('WorkletDemoScreen: Button clicked', counter.value);
    runOnUI(incrementWorklet)();
  };

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
      }}
    >
      <Text style={{ fontSize: 20, marginBottom: 16 }}>
        Reanimated Worklet Demo
      </Text>
      <Button
        title="Increment counter using worklet (UI thread)"
        onPress={handleIncrement}
      />
      <Text style={{ marginTop: 16, fontSize: 18 }}>
        Counter: {counterValue}
      </Text>
      <Text style={{ marginTop: 32, color: '#888', fontSize: 14 }}>
        This demonstrates incrementing a counter using a UI-thread worklet in
        react-native-reanimated.
      </Text>
    </View>
  );
}

export default WorkletDemoScreen;
