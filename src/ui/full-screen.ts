import './full-screen.css'
import { detectTWA } from './utils'

export function fullScreenButton(){
  
  const fullScreenButton = document.querySelector('button.full-screen') as HTMLElement
  const footer = document.querySelector('footer') as HTMLElement
  const lilgui = document.querySelector('.lil-gui') as HTMLElement
  if(!fullScreenButton) return;

  // Detect if running in TWA
  const isTWA = detectTWA();

  fullScreenButton.addEventListener('click',() => {

    if(isTWA) {
      // In TWA, use CSS-based full screen simulation
      handleTWAFullscreen(fullScreenButton, footer, lilgui);
    } else {
      // In regular browser, use native fullscreen API
      handleBrowserFullscreen(fullScreenButton, footer, lilgui);
    }
  })
}

function handleTWAFullscreen(button: HTMLElement, footer: HTMLElement, lilgui: HTMLElement) {
  const isCurrentlyFullscreen = button.classList.contains('on');
  
  if (!isCurrentlyFullscreen) {
    // Enter "fullscreen" mode in TWA
    button.classList.add('on');
    footer.classList.add('full-screen');
    lilgui.classList.add('full-screen');
    
  } else {
    // Exit "fullscreen" mode in TWA
    button.classList.remove('on');
    footer.classList.remove('full-screen');
    lilgui.classList.remove('full-screen');
  }
}

function handleBrowserFullscreen(button: HTMLElement, footer: HTMLElement, lilgui: HTMLElement) {
  if(!document.fullscreenElement){
    button.classList.add('on')
    footer.classList.add('full-screen')
    lilgui.classList.add('full-screen')
    
    // Try different fullscreen methods for cross-browser compatibility
    const docEl = document.documentElement as any;
    if (docEl.requestFullscreen) {
      docEl.requestFullscreen();
    } else if (docEl.mozRequestFullScreen) {
      docEl.mozRequestFullScreen();
    } else if (docEl.webkitRequestFullscreen) {
      docEl.webkitRequestFullscreen();
    } else if (docEl.msRequestFullscreen) {
      docEl.msRequestFullscreen();
    }
  } else {
    button.classList.remove('on')
    footer.classList.remove('full-screen')
    lilgui.classList.remove('full-screen')
    
    // Try different exit fullscreen methods
    const doc = document as any;
    if (doc.exitFullscreen) {
      doc.exitFullscreen();
    } else if (doc.mozCancelFullScreen) {
      doc.mozCancelFullScreen();
    } else if (doc.webkitExitFullscreen) {
      doc.webkitExitFullscreen();
    } else if (doc.msExitFullscreen) {
      doc.msExitFullscreen();
    }
  }
}