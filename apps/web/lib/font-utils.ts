"use client";

import {
  Alegreya,
  Antonio,
  Gluten,
  Grenze_Gotisch,
  Merienda,
  Nunito,
  Open_Sans,
  Playwrite_NG_Modern,
  Shantell_Sans,
} from "next/font/google";

// Array of Google Fonts from the provided selection
const alegreya = Alegreya({ subsets: ["latin"] });
const antonio = Antonio({ subsets: ["latin"] });
const gluten = Gluten({ subsets: ["latin"] });
const grenze_gotisch = Grenze_Gotisch({ subsets: ["latin"] });
const merienda = Merienda({ subsets: ["latin"] });
const nunito = Nunito({ subsets: ["latin"] });
const open_sans = Open_Sans({ subsets: ["latin"] });
const playwrite_ng_modern = Playwrite_NG_Modern({ weight: "400" });
const shantell_sans = Shantell_Sans({ subsets: ["latin"] });

const fonts = [
  alegreya,
  antonio,
  gluten,
  grenze_gotisch,
  merienda,
  nunito,
  open_sans,
  playwrite_ng_modern,
  shantell_sans,
];

// Function to get a random font from the array
export function getRandomFont(): string {
  const randomIndex =
    Math.floor(Math.random() * (fonts.length * 333)) % fonts.length;
  return fonts[randomIndex]?.className || "asdf"; // Fallback to Nunito if undefined
}
