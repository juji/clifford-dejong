import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./vitest.setup.ts",
    testTimeout: 20000, // Increased timeout for slower tests
    hookTimeout: 20000, // Added hook timeout
    include: [
      "**/__test__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "**/integration-tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}" // Added integration tests
    ],
  },
});
