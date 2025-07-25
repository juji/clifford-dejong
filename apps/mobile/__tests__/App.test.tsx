/**
 * @format
 */

import 'react-native';
import React from 'react';
import { render } from '@testing-library/react-native';

// Import Jest mocking utilities
import { jest } from '@jest/globals';

// Mock modules before importing
jest.mock('../src/navigation/app-navigator', () => ({
  __esModule: true,
  default: () => null,
}));

// Now we can safely import App
import App from '../src/main';

describe('Basic Tests', () => {
  it('should pass a simple test', () => {
    expect(1 + 1).toBe(2);
  });
});

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
