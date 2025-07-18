"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getRandomFont } from "@/lib/font-utils";

export function Header() {
  const [fontFamily, setFontFamily] = useState("Roboto");
  
  useEffect(() => {
    // Get a random font on component mount
    const font = getRandomFont();
    setFontFamily(font);
    
    // Dynamically load the Google Font with variable weights where applicable
    const link = document.createElement('link');
    
    // Format the font name for URL and determine if it needs variable weights
    const formattedFont = font.replace(/\s+/g, '+');
    
    // Different font weights for different font families based on your collection
    let fontWeightParam;
    if (['Alegreya', 'Nunito', 'Open Sans', 'Roboto Mono', 'Shantell Sans', 'Winky Rough'].includes(font)) {
      // These fonts support italic and variable weights
      fontWeightParam = 'ital,wght@0,300..800;1,300..800';
    } else if (['Antonio', 'Cinzel', 'Gabarito', 'Gluten', 'Grenze Gotisch', 'Merienda'].includes(font)) {
      // These fonts support only variable weights, no italics
      fontWeightParam = 'wght@300..800';
    } else {
      // Playwrite fonts and others with limited weights
      fontWeightParam = 'wght@100..400';
    }
    
    link.href = `https://fonts.googleapis.com/css2?family=${formattedFont}:${fontWeightParam}&display=swap`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    
    return () => {
      // Clean up the font link when component unmounts
      document.head.removeChild(link);
    };
  }, []);

  return (
    <header className="fixed top-0 left-0 p-4 z-[10]">
      <h1 className="text-2xl font-light" style={{ fontFamily: `"${fontFamily}", sans-serif` }}>
        <Link href="/" className="hover:underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded px-1">
          Chaos Canvas
        </Link>
      </h1>
    </header>
  );
}
