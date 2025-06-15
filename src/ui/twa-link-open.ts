/**
 * TWA External Link Handler
 * Detects if the app is running as a Trusted Web Activity (Android app)
 * and handles external links appropriately
 */

import { detectTWA } from './utils';

export function setupTWABehavior() {
  const isTWA = detectTWA();
  
  if (isTWA) {
    setupExternalLinkBehavior();
  }
}

/**
 * Setup external link behavior for TWA
 */
function setupExternalLinkBehavior() {
  // Handle the main logo link
  const mainLogo = document.getElementById('main-logo');
  if (mainLogo) {
    mainLogo.addEventListener('click', handleExternalLink);
  }
  
  // Handle other external links in footer
  const footerLinks = document.querySelectorAll('footer a[target="_blank"]');
  footerLinks.forEach(link => {
    link.addEventListener('click', handleExternalLink);
  });
  
  // Handle attribution links in info section
  const infoLinks = document.querySelectorAll('.info-content a[target="_blank"]');
  infoLinks.forEach(link => {
    link.addEventListener('click', handleExternalLink);
  });
}

/**
 * Handle external link clicks in TWA environment
 */
function handleExternalLink(event: Event) {
  event.preventDefault();
  
  const link = event.currentTarget as HTMLAnchorElement;
  const url = link.href;
  
  if (!url) return;
  
  openInExternalBrowser(url);
}

/**
 * Open URL in external browser using various methods
 */
function openInExternalBrowser(url: string) {
  try {
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
    if (newWindow) return;
  } catch (error) {}
  
  if (/Android/i.test(navigator.userAgent)) {
    try {
      const intentUrl = `intent://${url.replace(/^https?:\/\//, '')}#Intent;scheme=https;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;end`;
      window.location.assign(intentUrl);
      return;
    } catch (error) {}
  }
  
  try {
    const tempLink = document.createElement('a');
    tempLink.href = url;
    tempLink.target = '_blank';
    tempLink.rel = 'noopener noreferrer';
    tempLink.style.display = 'none';
    
    document.body.appendChild(tempLink);
    tempLink.click();
    document.body.removeChild(tempLink);
    return;
  } catch (error) {}
  
  try {
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'OPEN_EXTERNAL_LINK', url }, '*');
      return;
    }
  } catch (error) {}
  
  showExternalLinkMessage(url);
}

/**
 * Show a message to user with the URL to copy/open manually
 */
function showExternalLinkMessage(url: string) {
  const message = `To visit this link, please copy and open it in your browser:\n\n${url}`;
  
  // Try to copy to clipboard
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(() => {
      alert(`Link copied to clipboard!\n\n${url}\n\nPaste it in your browser to visit.`);
    }).catch(() => {
      alert(message);
    });
  } else {
    alert(message);
  }
}

/**
 * Initialize TWA detection and setup
 */
export function initTWADetection() {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupTWABehavior);
  } else {
    setupTWABehavior();
  }
}
