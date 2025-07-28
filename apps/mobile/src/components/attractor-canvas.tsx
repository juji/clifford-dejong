import { View } from 'tamagui';
import { Canvas, Image, Group } from '@shopify/react-native-skia';

import { useAttractorStore } from '@repo/state/attractor-store';
import { makeDefaultImage /* makeImage */ } from '@/lib/skia-image';
import { useEffect, useMemo, useState } from 'react';
import type { SkImage } from '@shopify/react-native-skia';
import { Dimensions } from 'react-native';

function useMakeImage() {
  const [image, setImage] = useState<SkImage | null>(null);

  useEffect(() => {
    const img = makeDefaultImage();
    setImage(img);
  }, []);

  return image;
}

// function useAttractorImage() {

//   const { width, height } = Dimensions.get('window');
//   const [image, setImage] = useState<SkImage | null>(null);
//   const imageData = new Uint32Array();

//   useEffect(() => {
//     if (imageData) {
//       const img = makeImage(imageData, width, height);
//       setImage(img);
//     }
//   }, [imageData, width, height]);

//   return image;

// }

export function AttractorCanvas() {
  const { attractorParameters } = useAttractorStore();
  const { background } = attractorParameters;

  const { width, height } = Dimensions.get('window');

  const backgroundRgba = useMemo(() => {
    return `rgba(${background[0]}, ${background[1]}, ${background[2]}, ${background[3] / 255})`;
  }, [background]);

  const image = useMakeImage();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: backgroundRgba,
      }}
    >
      <Canvas style={{ flex: 1, width: '100%', height: '100%' }}>
        <Image
          image={image}
          fit="contain"
          x={0}
          y={0}
          width={width}
          height={height}
        />
      </Canvas>
    </View>
  );
}
