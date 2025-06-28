'use client'
import React, { useState, useEffect } from "react";
import { cn } from "../lib/utils";

const TRANSFORM_DURATION = '0.3s';

export function FullScreenButton() {
  const [showButton, setShowButton] = useState(false);

  // Detect iOS and hide button if on iOS
  useEffect(() => {
    if (typeof window !== 'undefined' && window.navigator) {
      const ua = window.navigator.userAgent;
      const isIOS = /iPad|iPhone|iPod/.test(ua) ||
        (ua.includes('Macintosh') && 'ontouchend' in document);
      if (isIOS) setShowButton(false);
      else setShowButton(true);
    }
  }, []);

  if (!showButton) return null;
  return <FullScreenButtonChild />;
}

function FullScreenButtonChild() {
  const [rotated, setRotated] = useState(false);
  const [scaleClass, setScaleClass] = useState('scale-60');

  // Detect coarse or none pointer (touch device)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const isTouch = window.matchMedia('(pointer: coarse), (pointer: none)').matches;
      setScaleClass(isTouch ? 'scale-75' : 'scale-60');
    }
  }, []);

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

  function handleTouchStart(e: React.TouchEvent<HTMLButtonElement>) {
    e.currentTarget.classList.remove('scale-75');
    e.currentTarget.classList.add('scale-60');
  }
  function handleTouchEnd(e: React.TouchEvent<HTMLButtonElement>) {
    e.currentTarget.classList.remove('scale-60');
    e.currentTarget.classList.add('scale-75');
  }

  return (
    <button
      type="button"
      aria-label="Toggle fullscreen"
      className={cn(`
        fs-button fixed bottom-15 right-6 z-[200] rounded-full
        w-16 h-16
        bg-background text-foreground shadow-lg border-2 border-foreground
        focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer
        hover:scale-75 transition-transform duration-200
        ${scaleClass}
      `)}
      onClick={handleFullScreen}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <span className="fs-child block relative w-8 h-8 mx-auto my-auto">
        {corners.map((corner, i) => (
          <span key={i} className={`fs-corner block ${corner.className}`} style={corner.style} />
        ))}
      </span>
    </button>
  );
}

