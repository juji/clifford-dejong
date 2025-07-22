/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './App.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // Here we can extend the default Tailwind theme
      lineHeight: {
        // Default Tailwind line height values
        none: '1', // Default - no line height (equivalent to 1)
        tight: '1.25', // Default - tighter than normal
        snug: '1.375', // Default - slightly tighter than normal
        normal: '1.625', // Custom - slightly more than normal
        relaxed: '1.75', // Custom - slightly higher than Tailwind's default (1.625)
        loose: '2', // Default - loose line height
        'extra-loose': '2.5', // Custom - very spacious line height
      },
      fontSize: {
        // Explicitly setting font sizes to the Tailwind defaults
        xs: '12px', // Default size
        sm: '14px', // Default size
        base: '16px', // Default size
        lg: '18px', // Default size
        xl: '20px', // Default size
        '2xl': '24px', // Default size
        '3xl': '30px', // Default size
        '4xl': '36px', // Default size
        '5xl': '48px', // Default size
        '6xl': '60px', // Default size
        '7xl': '72px', // Default size
        '8xl': '96px', // Default size
        '9xl': '128px', // Default size
      },
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
