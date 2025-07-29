import { View } from 'tamagui';
import { useGlobalStore } from '../store/global-store';

export function ProgressBar() {
  const progress = useGlobalStore(s => s.attractorProgress);

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
      <View
        style={{
          height: '100%',
          width: `${Math.max(0, Math.min(1, progress)) * 100}%`,
          backgroundColor: '#fbbf24', // amber-400
          borderRadius: 3,
          transition: 'width 0.2s cubic-bezier(0.4,0,0.2,1)',
        }}
      />
    </View>
  );
}
