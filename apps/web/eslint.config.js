// Import base Next.js config
import { nextJsConfig } from "@repo/eslint-config/next-js";

// Define our extended config
/** @type {import("eslint").Linter.Config} */
const config = [
  ...nextJsConfig, // Spread the base config array
  {
    // Add specific rules for test files
    files: ["**/__test__/**/*.{ts,tsx}", "**/*.test.{ts,tsx}"],
    rules: {
      // Allow 'any' type in test files since we often mock complex objects
      "@typescript-eslint/no-explicit-any": "off",
      
      // Allow 'this' alias in certain test scenarios
      "@typescript-eslint/no-this-alias": "off"
    }
  }
];

export default config;
