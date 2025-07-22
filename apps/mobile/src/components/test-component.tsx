import React from 'react';
import { View, Text } from 'react-native';

// A test component showing different font sizes with default Tailwind sizes
export const TestComponent = () => {
  return (
    <View>
      <Text className="text-xs text-gray-800 dark:text-gray-200 mb-2">
        Text Extra Small (xs): 12px
      </Text>
      <Text className="text-sm text-gray-800 dark:text-gray-200 mb-2">
        Text Small (sm): 14px
      </Text>
      <Text className="text-base text-gray-800 dark:text-gray-200 mb-2">
        Text Base: 16px
      </Text>
      <Text className="text-lg text-gray-800 dark:text-gray-200 mb-2">
        Text Large (lg): 18px
      </Text>
      <Text className="text-xl text-gray-800 dark:text-gray-200 mb-2">
        Text Extra Large (xl): 20px
      </Text>
      <Text className="text-2xl text-gray-800 dark:text-gray-200 mb-2">
        Text 2XL: 24px
      </Text>
      <Text className="text-3xl text-gray-800 dark:text-gray-200 mb-2">
        Text 3XL: 30px
      </Text>
      <Text className="text-4xl text-gray-800 dark:text-gray-200 mb-2">
        Text 4XL: 36px
      </Text>
      <Text className="text-5xl text-gray-800 dark:text-gray-200 mb-2">
        Text 5XL: 48px
      </Text>
    </View>
  );
};
