import { useState } from 'react';
// import { ScrollView } from 'react-native';
import { Text, Button, View, ScrollView } from 'tamagui';
import { calculateAttractorNative } from '@/lib/calculate-attractor-native';

export function Jsi() {
  // const [started, setStarted] = useState(false);
  const [message, setMessage] = useState('Press the button to start');

  function buttonPress() {
    // if (started) {
    //   return;
    // }
    // setStarted(true);
    const m = calculateAttractorNative({ timestamp: new Date().toISOString() });
    setMessage(m);
  }

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text>JSI Example</Text>

      <Button
        size="$5"
        themeInverse
        onPress={() => buttonPress()}
        style={{ marginTop: 20 }}
        // disabled={started}
      >
        {/* {started ? 'Started' : 'Start'} */}
        Start Calculation
      </Button>

      <View
        style={{
          width: '90%',
          margin: 20,
          height: 550,
          // borderColor: '$textColor',
          borderRadius: 10,
          borderWidth: 1,
        }}
        borderColor="$borderColor"
      >
        <ScrollView style={{ padding: 20 }}>
          <Text>{message}</Text>
        </ScrollView>
      </View>
    </View>
  );
}
