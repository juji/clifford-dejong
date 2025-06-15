/**
 * TWA Detection and External Link Handler
 * Detects if the app is running as a Trusted Web Activity (Android app)
 * and handles external links appropriately
 */

export function setupTWABehavior() {
  // Detect if running as TWA
  const isTWA = detectTWA();
  
  if (isTWA) {
    console.log('🤖 Running as TWA - Setting up external link behavior');
    setupExternalLinkBehavior();
  }
}

/**
 * Detect if the app is running as a Trusted Web Activity
 */
function detectTWA(): boolean {
  // Check for TWA-specific indicators
  const twaIndicators = [
    // Check for Android WebView user agent
    /wv\)/i.test(navigator.userAgent),
    
    // Check if running in standalone mode (PWA/TWA)
    window.matchMedia('(display-mode: standalone)').matches,
    
    // Check for Android-specific user agent
    /Android/i.test(navigator.userAgent),
    
    // Check if window.open behavior is restricted (common in TWA)
    typeof window.open === 'function' && isWindowOpenRestricted()
  ];
  
  // Consider it TWA if multiple indicators are true
  const indicatorCount = twaIndicators.filter(Boolean).length;
  return indicatorCount >= 2;
}

/**
 * Check if window.open is restricted (common in TWA environment)
 */
function isWindowOpenRestricted(): boolean {
  try {
    // Try to open a window with a data URL
    const testWindow = window.open('data:text/html,<script>window.close()</script>', '_blank');
    if (testWindow) {
      testWindow.close();
      return false;
    }
    return true;
  } catch (error) {
    return true;
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
  
  console.log('🔗 Opening external link in browser:', url);
  
  // Try different methods to open external browser
  openInExternalBrowser(url);
}

/**
 * Open URL in external browser using various methods
 */
function openInExternalBrowser(url: string) {
  // Method 1: Try standard window.open with specific TWA-friendly parameters
  try {
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
    if (newWindow) {
      console.log('✅ Opened via window.open');
      return;
    }
  } catch (error) {
    console.log('❌ window.open failed:', error);
  }
  
  // Method 2: Try using location.assign with intent URL (Android-specific)
  if (/Android/i.test(navigator.userAgent)) {
    try {
      const intentUrl = `intent://${url.replace(/^https?:\/\//, '')}#Intent;scheme=https;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;end`;
      window.location.assign(intentUrl);
      console.log('✅ Opened via Android intent');
      return;
    } catch (error) {
      console.log('❌ Android intent failed:', error);
    }
  }
  
  // Method 3: Try creating a temporary link with download attribute
  try {
    const tempLink = document.createElement('a');
    tempLink.href = url;
    tempLink.target = '_blank';
    tempLink.rel = 'noopener noreferrer';
    tempLink.style.display = 'none';
    
    document.body.appendChild(tempLink);
    tempLink.click();
    document.body.removeChild(tempLink);
    
    console.log('✅ Opened via temporary link');
    return;
  } catch (error) {
    console.log('❌ Temporary link failed:', error);
  }
  
  // Method 4: Fallback - try to use postMessage to parent (if in iframe)
  try {
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'OPEN_EXTERNAL_LINK', url }, '*');
      console.log('✅ Sent to parent via postMessage');
      return;
    }
  } catch (error) {
    console.log('❌ postMessage failed:', error);
  }
  
  // Method 5: Last resort - show user a message
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
