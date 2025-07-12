import plugin from 'tailwindcss/plugin';

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {},
  },
  plugins: [
    plugin(function({ addVariant }) {
      // Add a `touch` variant for targeting touch devices
      addVariant('touch', '@media (hover: none)');
      // Add a `can-hover` variant for targeting devices with hover capability
      addVariant('can-hover', '@media (hover: hover)');
    })
  ],
};
