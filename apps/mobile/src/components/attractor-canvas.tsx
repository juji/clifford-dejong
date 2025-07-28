import { View } from 'tamagui';
import { Canvas, Circle, Group } from '@shopify/react-native-skia';

import { useAttractorStore } from '@repo/state/attractor-store';

export function AttractorCanvas() {
  const { attractorParameters } = useAttractorStore();
  const { background } = attractorParameters;

  const width = 256;
  const r = width * 0.33;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: `rgba(${background[0]}, ${background[1]}, ${background[2]}, ${background[3] / 255})`,
      }}
    >
      <Canvas style={{ flex: 1, width: '100%', height: '100%' }}>
        <Group blendMode="multiply">
          <Circle cx={r} cy={r} r={r} color="cyan" />
          <Circle cx={width - r} cy={r} r={r} color="magenta" />
          <Circle cx={width / 2} cy={width - r} r={r} color="yellow" />
        </Group>
      </Canvas>
    </View>
  );
}
