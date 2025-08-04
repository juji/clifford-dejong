import { useState } from 'react';
// import { ScrollView } from 'react-native';
import { Text, Button, View, ScrollView, Progress } from 'tamagui';
import { calculateAttractorNative } from '@/lib/calculate-attractor-native';

const styles = {
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    marginTop: 20,
  },
  resultbox: {
    width: '90%',
    margin: 20,
    height: 550,
    borderRadius: 10,
    borderWidth: 1,
  },
  scrollview: {
    padding: 20,
  },
  progresscontainer: {
    marginBottom: 20,
  },
  progresstext: {
    fontWeight: 'bold',
    marginBottom: 10,
  },
  percenttext: {
    textAlign: 'center' as const,
    marginTop: 5,
  },
  pixeldatacontainer: {
    marginBottom: 20,
  },
  pixeldatatext: {
    fontWeight: 'bold',
    marginBottom: 10,
  },
  resulttext: {
    fontWeight: 'bold',
    marginBottom: 10,
  },
};

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
    <View style={styles.container}>
      <Text>JSI Example</Text>

      <Button
        size="$5"
        themeInverse
        onPress={() => buttonPress()}
        style={styles.button}
        // disabled={started}
      >
        {/* {started ? 'Started' : 'Start'} */}
        Start Calculation
      </Button>

      <View style={styles.resultbox} borderColor="$borderColor">
        <ScrollView style={styles.scrollview}>
          {progress > 0 && (
            <View style={styles.progresscontainer}>
              <Text style={styles.progresstext}>Progress:</Text>
              <Progress value={progress * 100}>
                <Progress.Indicator animation="bouncy" />
              </Progress>
              <Text style={styles.percenttext}>
                {Math.round(progress * 100)}%
              </Text>
            </View>
          )}

          {pixelData && (
            <View style={styles.pixeldatacontainer}>
              <Text style={styles.pixeldatatext}>
                Pixel Data ({isDone ? 'Complete' : 'In Progress'}):
              </Text>
              <Text>Received {pixelData.length} data points</Text>
            </View>
          )}

          <Text style={styles.resulttext}>Result:</Text>
          <Text>{message}</Text>
        </ScrollView>
      </View>
    </View>
  );
}
