import { View } from 'tamagui';
import { useGlobalStore } from '@/store/global-store';
import Animated, {
  useSharedValue,
  interpolate,
  Extrapolation,
  withSpring,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { useWindowDimensions } from 'react-native';

export function ProgressBar() {
  const progress = useGlobalStore(s => s.attractorProgress);
  const width = useSharedValue(0);
  const { width: windowWidth } = useWindowDimensions();

  useEffect(() => {
    const val = interpolate(
      progress,
      [0, 1],
      [0, windowWidth],
      Extrapolation.CLAMP,
    );
    width.set(withSpring(val, { damping: 30, stiffness: 90 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, windowWidth]);

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 5,
        zIndex: 100,
        backgroundColor: 'transparent',
        pointerEvents: 'none',
      }}
    >
      <Animated.View
        style={[
          {
            width,
            height: '100%',
            backgroundColor: '#fbbf24', // amber-400
            borderRadius: 3,
          },
        ]}
      />
    </View>
  );
}
