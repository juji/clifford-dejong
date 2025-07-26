import React from 'react';
import { useColorScheme } from 'react-native';

import Lucide, { type LucideIconName } from '@react-native-vector-icons/lucide';
import { TextStyle, StyleProp } from 'react-native';

// Icon name from the Lucide glyph map. See Lucide.json for valid names.
type ThemeAwareIconProps = {
  name: LucideIconName;
  size?: number;
  style?: StyleProp<TextStyle>;
  testID?: string;
  allowFontScaling?: boolean;
  // Add more as needed
};

const ThemeAwareIcon: React.FC<ThemeAwareIconProps> = ({
  name,
  size,
  style,
  testID,
  allowFontScaling,
}) => {
  const isDark = useColorScheme() === 'dark';
  const color = isDark ? '#fff' : '#222';
  // Workaround: cast name to any to satisfy TS union type
  return (
    <Lucide
      name={name as any}
      size={size}
      style={style}
      color={color}
      testID={testID}
      allowFontScaling={allowFontScaling}
    />
  );
};

export default ThemeAwareIcon;
