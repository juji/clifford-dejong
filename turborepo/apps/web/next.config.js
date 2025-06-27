import { withTamagui } from "@tamagui/next-plugin";

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default withTamagui({
  config: "./tamagui.config.ts",
  components: ["tamagui"],
  appDir: true,
  outputCSS:
    process.env.NODE_ENV === "production" ? "./public/tamagui.css" : null,
  disableExtraction: process.env.NODE_ENV === "development",
});
