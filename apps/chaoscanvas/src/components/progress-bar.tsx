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

const styles = {
  progressbar: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    height: 5,
    zIndex: 100,
    backgroundColor: 'transparent',
    pointerEvents: 'none' as const,
  },
  progressbarfill: {
    height: '100%' as any,
    backgroundColor: '#fbbf24',
    borderRadius: 3,
  },
};

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
    <View style={styles.progressbar}>
      <Animated.View style={[{ width }, styles.progressbarfill]} />
    </View>
  );
}
