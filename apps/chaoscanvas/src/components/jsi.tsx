import { useEffect, useRef, useState } from 'react';
// import { ScrollView } from 'react-native';
import { Dimensions } from 'react-native';

import { Text, Button, View, ScrollView, Progress } from 'tamagui';
import {
  Canvas,
  Image as SkiaImage,
  Skia,
  AlphaType,
  ColorType,
} from '@shopify/react-native-skia';
import {
  calculateAttractorNative,
  ratePerformance,
  getBuildNumber,
} from '@/lib/calculate-attractor-native';
import { useNavigation } from '@react-navigation/native';

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
  imageContainer: {
    marginTop: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  imageTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
  },
  attractorImage: {
    width: Dimensions.get('window').width * 0.8, // 80% of screen width
    height: Dimensions.get('window').height * 0.8,
    borderRadius: 8,
  },
};

export function Jsi() {
  // const [started, setStarted] = useState(false);
  const [message, setMessage] = useState('Press the button to start');
  const [progress, setProgress] = useState(0);
  const [pixelData, setPixelData] = useState<Uint8Array | null>(null);
  const [skiaImage, setSkiaImage] = useState<ReturnType<
    typeof Skia.Image.MakeImage
  > | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [isDone, setIsDone] = useState(false);
  const cancelRef = useRef<(() => void) | null>(null);
  const [performanceRating, setPerformanceRating] = useState<{
    pointsPerIteration: number;
  } | null>(null);
  const navigation = useNavigation();
  const { width, height } = Dimensions.get('window');

  useEffect(() => {
    console.log('version', getBuildNumber());
    // Rate performance on mount
    setPerformanceRating(ratePerformance());
  }, []);

  useEffect(() => {
    console.log('Jsi component mounted');
    // Add listeners for navigation focus and blur events
    const unsubscribeFocus = navigation.addListener('focus', () => {
      console.log('Jsi screen focused');
    });

    const unsubscribeBlur = navigation.addListener('blur', () => {
      console.log('Jsi screen blurred');
      if (cancelRef.current) {
        console.log('Cancelling calculation on unmount');
        cancelRef.current();
        cancelRef.current = null;
      }
    });

    return () => {
      console.log('Jsi component unmounted');
      // Cleanup listeners
      unsubscribeFocus();
      unsubscribeBlur();
      // Cancel any ongoing calculation if the component unmounts
      if (cancelRef.current) {
        console.log('Cancelling calculation on unmount');
        cancelRef.current();
        cancelRef.current = null;
      }
    };
  }, [navigation]);

  function buttonPress() {
    // Reset states
    setProgress(0);
    setPixelData(null);
    setSkiaImage(null);
    setLastUpdateTime(null);
    setIsDone(false);
    setMessage('Calculation started...');

    const now = new Date().getTime();
    const { promise, cancel, imageView } = calculateAttractorNative({
      pointsPerIteration: performanceRating?.pointsPerIteration || 2_000_000,
      width: Math.round(width),
      height: Math.round(height),
      highQuality: true,
      log: false,
      onProgress: (totalProgress, totalPoints, totalAttractorPoints) => {
        setProgress(totalProgress);
        console.log(
          `Progress: ${Math.round(totalProgress * 100)}%, Points: ${totalPoints}, Total Attractor Points: ${totalAttractorPoints}`,
        );
      },
      onImageUpdate: () => {
        if (imageView) {
          console.log(`image updated`);
          console.log(
            `Image data sum: `,
            // Assuming imageView is a Uint8Array
            imageView.reduce((acc, val) => acc + val, 0),
          );

          try {
            // Convert the Uint8Array to a Skia image
            const imageWidth = Math.round(width);
            const imageHeight = Math.round(height);

            // Create Skia data from the Uint8Array
            const skiaData = Skia.Data.fromBytes(imageView);

            // Create a Skia image
            const image = Skia.Image.MakeImage(
              {
                width: imageWidth,
                height: imageHeight,
                alphaType: AlphaType.Premul,
                colorType: ColorType.RGBA_8888,
              },
              skiaData,
              imageWidth * 4, // Bytes per row (4 bytes per pixel: RGBA)
            );

            if (image) {
              setSkiaImage(image);
              setLastUpdateTime(new Date());
            } else {
              console.error('Failed to create Skia image');
            }
          } catch (error) {
            console.error('Error creating Skia image:', error);
          }
        }
      },
    });

    setPixelData(imageView);

    cancelRef.current = cancel;

    promise
      .then(result => {
        console.log('Attractor calculation result:', result);
        console.log(`Calculation took ${new Date().getTime() - now} ms`);
        setIsDone(true);
        setMessage(result);
      })
      .catch(error => {
        // id error
        if (error) {
          console.error('Error calculating attractor:', error);
          setMessage('Error calculating attractor');
        } else {
          console.error('Calculation was cancelled FROM JS');
          setMessage('Calculation was cancelled FROM JS');
        }
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

      <Button
        size="$5"
        themeInverse
        onPress={() => navigation.navigate('Example')}
        style={styles.button}
      >
        Go to Example
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
              <Text>Sum: {pixelData.reduce((acc, val) => acc + val, 0)}</Text>
            </View>
          )}

          <Text style={styles.resulttext}>Result:</Text>
          <Text>{message}</Text>

          <View style={styles.imageContainer}>
            <Text style={styles.imageTitle}>Attractor Visualization:</Text>
            {skiaImage ? (
              <Canvas style={styles.attractorImage}>
                <SkiaImage
                  image={skiaImage}
                  fit="contain"
                  x={0}
                  y={0}
                  width={styles.attractorImage.width}
                  height={styles.attractorImage.height}
                />
              </Canvas>
            ) : progress > 0 ? (
              <View
                style={[
                  styles.attractorImage,
                  {
                    backgroundColor: '#f0f0f0',
                    justifyContent: 'center',
                    alignItems: 'center',
                  },
                ]}
              >
                <Text>Generating visualization...</Text>
              </View>
            ) : (
              <View
                style={[
                  styles.attractorImage,
                  {
                    backgroundColor: '#f0f0f0',
                    justifyContent: 'center',
                    alignItems: 'center',
                  },
                ]}
              >
                <Text>Start calculation to see visualization</Text>
              </View>
            )}
            {lastUpdateTime && (
              <Text style={{ marginTop: 10, fontSize: 12, color: '#666' }}>
                Last updated: {lastUpdateTime.toLocaleTimeString()}
              </Text>
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
