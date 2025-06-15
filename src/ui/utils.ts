import { type Options } from "@/state"

export function getHsl(options: Options, minBrightness:number = 40){
  return `hsl(${options.hue}deg,${options.saturation}%,${Math.max(
    minBrightness,options.brightness/2
  )}%)`
}

/**
 * Detect if the app is running as an app-like environment
 * Works across platforms: Android TWA, iOS PWA, desktop PWA, etc.
 */
export function detectTWA(): boolean {
  // Primary indicator: standalone or fullscreen display mode
  const isAppMode = window.matchMedia('(display-mode: standalone)').matches || 
                   window.matchMedia('(display-mode: fullscreen)').matches;
  
  // iOS Safari PWA indicator
  const isIOSStandalone = (navigator as any).standalone === true;
  
  // WebView indicators (Android, iOS, desktop)
  const isWebView = /wv\)|WebView/i.test(navigator.userAgent);
  
  // Return true if any app-like indicator is present
  return isAppMode || isIOSStandalone || isWebView;
}
