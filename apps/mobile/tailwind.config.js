/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './App.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // Here we can extend the default Tailwind theme
      colors: {
        // Match your current theme colors
        primary: {
          light: '#ffffff',
          dark: '#000000',
        },
        text: {
          light: '#000000',
          dark: '#ffffff',
        },
        secondary: {
          light: '#666666',
          dark: '#cccccc',
        },
      },
    },
  },
  plugins: [],
};
