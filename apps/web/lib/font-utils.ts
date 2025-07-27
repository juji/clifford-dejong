"use client";

// Array of Google Fonts from the provided selection
const fonts = [
  "Alegreya",
  "Antonio",
  "Gluten",
  "Grenze Gotisch",
  "Merienda",
  "Nunito",
  "Open Sans",
  "Playwrite NG Modern",
  "Shantell Sans",
];

// Function to get a random font from the array
export function getRandomFont(): string {
  const randomIndex =
    Math.floor(Math.random() * (fonts.length * 333)) % fonts.length;
  return fonts[randomIndex] || "Gluten"; // Fallback to Nunito if undefined
}
