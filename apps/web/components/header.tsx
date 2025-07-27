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
  }, []);

  return (
    <header className="fixed top-0 left-0 p-4 z-[10]">
      <h1 className={`text-2xl font-light ${fontFamily}`}>
        <Link
          href="/"
          className={`hover:underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded px-1`}
        >
          Chaos Canvas
        </Link>
      </h1>
    </header>
  );
}
