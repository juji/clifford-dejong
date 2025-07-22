/**
 * @format
 */

import 'react-native';
import React from 'react';
import { render } from '@testing-library/react-native';

// Import Jest mocking utilities
import { jest } from '@jest/globals';

// Mock CSS imports
jest.mock('../global.css', () => ({}), { virtual: true });

// Mock the NativeWind provider
jest.mock('nativewind', () => ({
  useColorScheme: () => ({
    colorScheme: 'light',
    setColorScheme: jest.fn(),
  }),
}));

// Import App component (after mocks are defined)
import App from '../src/main';

// Test that the App component can be imported and created
describe('App', () => {
  it('imports without crashing', () => {
    // This verifies that the App component can be imported
    expect(App).toBeDefined();
  });

  it('renders without crashing', () => {
    // Use render from @testing-library/react-native to check if the component renders
    // If the render function doesn't throw an error, the test passes
    expect(() => render(<App />)).not.toThrow();
  });
});
