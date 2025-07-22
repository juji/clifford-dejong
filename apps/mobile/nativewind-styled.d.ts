/// <reference types="nativewind/types" />

import 'react-native';

declare module 'react-native' {
  interface ViewProps {
    className?: string;
  }
  interface TextProps {
    className?: string;
  }
  interface ScrollViewProps {
    className?: string;
    contentContainerClassName?: string;
  }
}

// Add support for third-party components
declare module '@react-native-community/slider' {
  interface SliderProps {
    className?: string;
  }
}
