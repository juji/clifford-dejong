// create something awesome!!

import './index.css'
import './button.css'
import './info-button.css'

import Renderer from './renderer'
import { ui, type UIOptions } from './ui'
const canvas = document.querySelector('canvas')

if(canvas) {
  
  const footer = document.querySelector('footer') as HTMLElement
  const footerDim = footer.getBoundingClientRect()

  const renderer = new Renderer(
    canvas,
    window.innerWidth,
    window.innerHeight - footerDim.height,
  )

  function onChange( options: UIOptions, paused: boolean ){
    renderer.setOptions(options, paused)
  }

  function initOptions( options: UIOptions ){
    renderer.setOptions(options, false)
  }
  
  const setProgress = ui( onChange, initOptions )
  renderer.setOnProgress((n: number) => {
    setProgress(n)
  })

  window.addEventListener('resize', () => {
    renderer.onResize(
      window.innerWidth,
      window.innerHeight - footerDim.height
    )
  })

}