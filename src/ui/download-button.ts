import './download-button.css'
import { optionStore } from '@/state'
import { getHsl } from './utils'
import { hsv2rgb } from '@/renderer/hsv2rgb'

// @ts-ignore
import getContrast from "get-contrast";

// Capacitor imports for mobile sharing
import { Capacitor } from '@capacitor/core'
import { Share } from '@capacitor/share'

function useBlackText(rgb:number[]){
  const color = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},1)`
  return getContrast.score("#000000", color) === 'AAA'
}

// Mobile-friendly download/share function
async function handleDownloadShare(image: string) {
  if (Capacitor.isNativePlatform()) {
    // On mobile, use native sharing
    try {
      await Share.share({
        title: 'Clifford DeJong Attractor',
        text: 'Check out this beautiful mathematical visualization!',
        url: image,
        dialogTitle: 'Share your creation'
      })
    } catch (error) {
      console.error('Error sharing:', error)
      // Fallback to regular download
      downloadImage(image)
    }
  } else {
    // On web, use regular download
    downloadImage(image)
  }
}

function downloadImage(image: string) {
  const link = document.createElement('a')
  link.href = image
  link.download = `clifford-dejong-${Date.now()}.png`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function downloadButton(){
  
  const { subscribe } = optionStore
  const link = document.querySelector('a.download') as HTMLAnchorElement

  const color = {
    text: '',
    main: '', 
    mainHover: '',
    secondary: ''
  }

  // not changing css style directly
  subscribe((state) => state.options, (options) => {

    const rgb = hsv2rgb(options.hue, options.saturation, options.brightness)
    color.text = useBlackText(rgb) ? 'black' : 'white'

    color.main = getHsl(options, 0)

    color.mainHover = getHsl({
      ...options,
      brightness: options.brightness * 1.2
    }, 0)

    color.secondary = getHsl({
      ...options,
      brightness: options.brightness * 1.5
    }, 0)

  },{ fireImmediately: true })

  subscribe((state) => state.image, (image) => {

    if(!link) return;

    link.style.setProperty('--color-text', color.text)
    link.style.setProperty('--color-main', color.main)
    link.style.setProperty('--color-main-hover', color.mainHover)
    link.style.setProperty('--color-secondary', color.secondary)

    if(image){
      link.classList.add('on')
      link.setAttribute('href', image)
      
      // Add click handler for mobile sharing
      link.onclick = (e) => {
        e.preventDefault()
        handleDownloadShare(image)
      }
    }else{
      link.setAttribute('href', '#')
      link.classList.remove('on')
      link.onclick = null
    }

  })

}