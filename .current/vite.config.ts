/** @type {import('vite').UserConfig} */

import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    // @ts-ignore
    tsconfigPaths(),
  ],
  build: {
    rollupOptions: {
      input: {
        main: "./index.html",
        sw: "./public/sw.js",
      },
    },
  },
});
