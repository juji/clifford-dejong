import './download-button.css'
import { optionStore } from '@/state'
import { getHsl } from './utils'
import { hsv2rgb } from '@/renderer/hsv2rgb'

// @ts-ignore
import getContrast from "get-contrast";

function useBlackText(rgb:number[]){
  const color = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},1)`
  return getContrast.score("#000000", color) === 'AAA'
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
    }else{
      link.setAttribute('href', '#')
      link.classList.remove('on')
    }

  })

}