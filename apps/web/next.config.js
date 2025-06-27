import { withTamagui } from "@tamagui/next-plugin";

/** @type {import('next').NextConfig} */
const nextConfig = {
  appDir: true,
};

export default withTamagui({
  config: "./tamagui.config.ts",
  components: ["tamagui"],
})(nextConfig);
