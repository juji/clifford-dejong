"use client";

// Array of Google Fonts from the provided selection
const fonts = [
  'Alegreya',
  'Antonio',
  'Cinzel',
  'Gabarito',
  'Gluten',
  'Grenze Gotisch',
  'Merienda',
  'Nunito',
  'Open Sans',
  'Playwrite DE Grund',
  'Playwrite ID',
  'Playwrite IN',
  'Playwrite NG Modern',
  'Playwrite NL',
  'Roboto Mono',
  'Shantell Sans',
  'Winky Rough'
];

// Function to get a random font from the array
export function getRandomFont(): string {
  const randomIndex = Math.floor(Math.random() * fonts.length);
  return fonts[randomIndex] || 'Nunito'; // Fallback to Nunito if undefined
}
