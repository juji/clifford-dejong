'use client'
import React, { useState, useEffect } from "react";
import { cn } from "../lib/utils";
import { useUIStore } from "../store/ui-store";

/**
 * Full Screen Button Component
 * 
 * Features:
 * 1. Cross-browser fullscreen API support (standard, webkit, moz, ms)
 * 2. Pure feature detection without platform-specific detection
 * 3. Animated corner indicators that rotate when entering/exiting fullscreen
 * 4. Responsive sizing based on device pointer type (touch vs mouse)
 * 
 * Note on Fullscreen Detection:
 * This component uses proper feature detection to determine if fullscreen is supported:
 * - Checks `document.fullscreenEnabled` (and vendor prefixed equivalents)
 * - Verifies availability of `requestFullscreen` methods
 * 
 * This approach avoids:
 * - Unreliable user-agent string parsing
 * - Platform-specific detection logic
 * - Deprecated APIs like navigator.vendor or window.orientation
 * 
 * If fullscreen functionality is unavailable or fails, the button's click handler
 * will handle the error gracefully without breaking the UI.
 */

const TRANSFORM_DURATION = '0.3s';

// Define browser-specific document interface
interface FullscreenDocument extends Document {
  webkitFullscreenEnabled?: boolean;
  mozFullScreenEnabled?: boolean;
  msFullscreenEnabled?: boolean;
}

// Define browser-specific element interface
interface FullscreenElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void>;
  mozRequestFullScreen?: () => Promise<void>;
  msRequestFullscreen?: () => Promise<void>;
}

export function FullScreenButton() {
  const [showButton, setShowButton] = useState(false);
  const menuOpen = useUIStore((s) => s.menuOpen);

  // Detect if fullscreen is properly supported
  useEffect(() => {
    if (typeof window !== 'undefined' && document) {
      const doc = document as FullscreenDocument;
      const docEl = document.documentElement as FullscreenElement;
      
      // Pure feature detection - check if fullscreen API is available
      const fullscreenSupported = 
        // Check for the fullscreen API being enabled
        (doc.fullscreenEnabled || 
         doc.webkitFullscreenEnabled ||
         doc.mozFullScreenEnabled || 
         doc.msFullscreenEnabled) 
        && 
        // Check for the actual methods
        (docEl.requestFullscreen ||
         docEl.webkitRequestFullscreen ||
         docEl.mozRequestFullScreen ||
         docEl.msRequestFullscreen);
      
      // Only show button if fullscreen API is supported
      // This matches the updated test expectations
      setShowButton(!!fullscreenSupported);
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

  // Define fullscreen document interface for exit methods
  interface FullscreenExitDocument extends Document {
    webkitExitFullscreen?: () => Promise<void>;
    mozCancelFullScreen?: () => Promise<void>;
    msExitFullscreen?: () => Promise<void>;
    webkitFullscreenElement?: Element;
    mozFullScreenElement?: Element;
    msFullscreenElement?: Element;
  }
  
  function handleFullScreen() {
    const el = document.documentElement as FullscreenElement;
    const doc = document as FullscreenExitDocument;
    
    // Check for fullscreen state across different browsers
    const fullscreenElement = 
      doc.fullscreenElement || 
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement || 
      doc.msFullscreenElement;
      
    if (!fullscreenElement) {
      // Request fullscreen using the appropriate method for the browser
      if (el.requestFullscreen) {
        el.requestFullscreen().catch(err => console.error("Error attempting to enable full-screen mode:", err));
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
      } else if (el.mozRequestFullScreen) {
        el.mozRequestFullScreen();
      } else if (el.msRequestFullscreen) {
        el.msRequestFullscreen();
      }
      setRotated(true);
    } else {
      // Exit fullscreen using the appropriate method for the browser
      if (doc.exitFullscreen) {
        doc.exitFullscreen().catch(err => console.error("Error attempting to exit full-screen mode:", err));
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      } else if (doc.mozCancelFullScreen) {
        doc.mozCancelFullScreen();
      } else if (doc.msExitFullscreen) {
        doc.msExitFullscreen();
      }
      setRotated(false);
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

