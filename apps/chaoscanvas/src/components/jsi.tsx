import { useState } from 'react';
// import { ScrollView } from 'react-native';
import { Text, Button, View, ScrollView } from 'tamagui';

function useJsi() {
  // This is a placeholder for the JSI functionality.
  // In a real application, this would interface with native code.
  return {
    sendMessage: async (message: string) => {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate async operation
      return `Hello from JSI, received message: ${message}`;
    },
  };
}

export function Jsi() {
  const [started, setStarted] = useState(false);
  const [message, setMessage] = useState('Press the button to start');

  const { sendMessage } = useJsi();

  function buttonPress() {
    if (started) {
      return;
    }
    setStarted(true);
    sendMessage(new Date().toISOString()).then(response => {
      setStarted(false);
      setMessage(response);
    });
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
        disabled={started}
      >
        {started ? 'Started' : 'Start'}
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
