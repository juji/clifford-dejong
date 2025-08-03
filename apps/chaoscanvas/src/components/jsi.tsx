import { useState } from 'react';
// import { ScrollView } from 'react-native';
import { Text, Button, View, ScrollView, Progress } from 'tamagui';
import { calculateAttractorNative } from '@/lib/calculate-attractor-native';

export function Jsi() {
  // const [started, setStarted] = useState(false);
  const [message, setMessage] = useState('Press the button to start');
  const [progress, setProgress] = useState(0);
  const [pixelData, setPixelData] = useState<number[] | null>(null);
  const [isDone, setIsDone] = useState(false);

  function buttonPress() {
    // Reset states
    setProgress(0);
    setPixelData(null);
    setIsDone(false);
    setMessage('Calculation started...');

    calculateAttractorNative({
      timestamp: new Date().toISOString(),
      // onProgress: (progressValue: number) => {
      //   console.log('Progress update:', progressValue);
      //   setProgress(progressValue);
      // },
      // onUpdate: (uint8string: string, done: boolean) => {
      //   const values = uint8string.split(',').map(Number);
      //   console.log(
      //     'Update received, data points:',
      //     values.length,
      //     'done:',
      //     done,
      //   );
      //   setPixelData(values);
      //   setIsDone(done);
      // },
    })
      .then(result => {
        console.log('Attractor calculation result:', result);
        setMessage(result);
      })
      .catch(error => {
        console.error('Error calculating attractor:', error);
        setMessage('Error calculating attractor');
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
          {progress > 0 && (
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>
                Progress:
              </Text>
              <Progress value={progress * 100}>
                <Progress.Indicator animation="bouncy" />
              </Progress>
              <Text style={{ textAlign: 'center', marginTop: 5 }}>
                {Math.round(progress * 100)}%
              </Text>
            </View>
          )}

          {pixelData && (
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>
                Pixel Data ({isDone ? 'Complete' : 'In Progress'}):
              </Text>
              <Text>Received {pixelData.length} data points</Text>
            </View>
          )}

          <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>Result:</Text>
          <Text>{message}</Text>
        </ScrollView>
      </View>
    </View>
  );
}
