import { withTamagui } from "@tamagui/next-plugin";

/** @type {import('next').NextConfig} */
const nextConfig = {
  
};

export default withTamagui({
  config: "./tamagui.config.ts",
  components: ["tamagui"],
  appDir: true,
})(nextConfig);
