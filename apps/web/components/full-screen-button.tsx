'use client'
import React, { useState } from "react";

const TRANSFORM_DURATION = '1s';

export function FullScreenButton() {
  const [rotated, setRotated] = useState(false);

  function handleFullScreen() {
    const el = document.documentElement;
    if (!document.fullscreenElement) {
      if (el.requestFullscreen) {
        el.requestFullscreen();
        setRotated(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setRotated(false);
      }
    }
  }

  // Properly sized and positioned corners for a 64x64 button
  // const cornerSize = 48; // px, bigger for fs-corner (unused)
  const cornerOffset = 0; // px, flush with fs-child edge
  // Use even smaller Tailwind sizing classes for fs-corner
  const cornerBase =
    `fs-corner block absolute w-3 h-3 border-3 border-current bg-transparent transition-transform`;
  // w-4 and h-4 are 1rem = 16px in Tailwind
  const corners = [
    // top-left
    {
      style: {
        top: cornerOffset,
        left: cornerOffset,
        transform: rotated ? "rotate(180deg)" : undefined,
        transition: `transform ${TRANSFORM_DURATION}`,
      },
      className: `${cornerBase} border-t-3 border-l-3 border-b-0 border-r-0 rounded-tl-sm`,
    },
    // top-right
    {
      style: {
        top: cornerOffset,
        right: cornerOffset,
        transform: rotated ? "rotate(-180deg)" : undefined,
        transition: `transform ${TRANSFORM_DURATION}`,
      },
      className: `${cornerBase} border-t-3 border-r-3 border-b-0 border-l-0 rounded-tr-sm`,
    },
    // bottom-left
    {
      style: {
        bottom: cornerOffset,
        left: cornerOffset,
        transform: rotated ? "rotate(-180deg)" : undefined,
        transition: `transform ${TRANSFORM_DURATION}`,
      },
      className: `${cornerBase} border-b-3 border-l-3 border-t-0 border-r-0 rounded-bl-sm`,
    },
    // bottom-right
    {
      style: {
        bottom: cornerOffset,
        right: cornerOffset,
        transform: rotated ? "rotate(180deg)" : undefined,
        transition: `transform ${TRANSFORM_DURATION}`,
      },
      className: `${cornerBase} border-b-3 border-r-3 border-t-0 border-l-0 rounded-br-sm`,
    },
  ];

  return (
    <button
      type="button"
      aria-label="Toggle fullscreen"
      className="fs-button fixed bottom-15 right-6 z-[200] rounded-full bg-background text-foreground shadow-lg border-2 border-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer scale-75"
      onClick={handleFullScreen}
      style={{ width: 64, height: 64, position: 'fixed' }}
    >
      <span className="fs-child block relative w-8 h-8 mx-auto my-auto">
        {corners.map((corner, i) => (
          <span key={i} className={`fs-corner block ${corner.className}`} style={corner.style} />
        ))}
      </span>
    </button>
  );
}
