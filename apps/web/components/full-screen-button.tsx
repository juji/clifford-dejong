'use client'
import React, { useState, useEffect } from "react";
import { cn } from "../lib/utils";
import { useUIStore } from "../store/ui-store";

/**
 * Full Screen Button Component
 * 
 * Note on iOS/iPadOS Detection:
 * This component uses modern, non-deprecated browser APIs to detect iOS/iPadOS devices
 * where fullscreen functionality doesn't work properly. The detection combines:
 * 1. Standard userAgent checks
 * 2. Touch capabilities and maxTouchPoints
 * 3. Platform-specific patterns in userAgent strings
 * 4. iOS-specific features like standalone mode
 * 
 * This avoids using deprecated APIs like navigator.vendor or window.orientation.
 */

const TRANSFORM_DURATION = '0.3s';

export function FullScreenButton() {
  const [showButton, setShowButton] = useState(false);
  const menuOpen = useUIStore((s) => s.menuOpen);

  // Detect iOS and hide button if on iOS (where fullscreen API doesn't work properly)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.navigator) {
      const ua = window.navigator.userAgent;
      
      // Standard iOS device detection - explicit mentions in UA
      const isStandardIOS = /iPad|iPhone|iPod/.test(ua);
      
      // Modern iPad detection that won't mistake Mac laptops for iPads
      const isIPadOS = 
        // New iPads with iPadOS 13+ report as Macintosh
        ua.includes('Macintosh') && 
        // Must have touch capabilities
        'ontouchend' in document && 
        // iPads typically have many touch points (5+)
        navigator.maxTouchPoints >= 5 &&
        // Specifically check for "like Mac OS X" (iOS signature) but NOT regular "Mac OS X" (macOS)
        // This avoids matching actual Macs that have touch capabilities
        ua.includes('like Mac OS X') && 
        // No Mac-specific version strings
        !(/Mac OS X 10[._]\d+/.test(ua));

      // Additional check for iOS-specific behaviors
      // Instead of relying on deprecated APIs, check for screen size/orientation features
      const hasIOSBehaviors = 
        // Check for standalone mode capability (iOS home screen apps)
        // Use proper type assertion for Safari/iOS specific property
        ('standalone' in window.navigator) &&
        // iOS Safari typically includes these terms in the UA
        /AppleWebKit/.test(ua) &&
        // Not Chrome browser (would indicate desktop Safari or other WebKit)
        !(/Chrome/.test(ua) && /Google Inc/.test(ua));
      
      // We only need to hide the button on iOS devices
      const isIOS = isStandardIOS || isIPadOS || hasIOSBehaviors;
      
      // Show the button if not on iOS, regardless of fullscreen API support
      // This matches the test expectation that button appears even if fullscreen isn't supported
      setShowButton(!isIOS);
    }
  }, []);

  if (!showButton || menuOpen) return null;
  return <FullScreenButtonChild />;
}

export function FullScreenButtonChild() {
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

