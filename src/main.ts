// create something awesome!!

import './index.css'
import './button.css'

import { optionStore } from '@/state'

import Renderer from './renderer'
import { ui } from './ui'

// Capacitor imports for mobile features
import { Capacitor } from '@capacitor/core'
import { SplashScreen } from '@capacitor/splash-screen'
import { StatusBar, Style } from '@capacitor/status-bar'

// Initialize mobile app features
if (Capacitor.isNativePlatform()) {
  // Hide splash screen when app is ready
  SplashScreen.hide()
  
  // Set status bar style
  StatusBar.setStyle({ style: Style.Dark })
  StatusBar.setBackgroundColor({ color: '#000000' })
}
const canvas = document.querySelector('canvas')

if(canvas) {
  
  const footer = document.querySelector('footer') as HTMLElement
  const footerDim = footer.getBoundingClientRect()
  const { subscribe } = optionStore
  const { options, setProgress, setImage } = optionStore.getState()

  ui()

  const renderer = new Renderer(
    canvas,
    window.innerWidth,
    window.innerHeight - footerDim.height,
    options,
    setProgress,
    setImage
  )


  subscribe((state) => state.options, (s) => {
    renderer.onUpdate(s)
  })

  subscribe((state) => state.paused, (paused) => {
    paused ? renderer.onPaused() : renderer.onPlay()
  })
  

  // renderer.onProgress(onProgress)
  // renderer.onFinish(onImageReady)

  window.addEventListener('resize', () => {
    const footerDim = footer.getBoundingClientRect()
    renderer.onResize(
      window.innerWidth,
      window.innerHeight - footerDim.height
    )
  })

}