// create something awesome!!

import './index.css'
import './button.css'
import './info-button.css'

import Ball from './ball'
// import { registerEvents } from './events'
// import { setLogoColor } from './set-logo-color'
import { ui } from './ui'
const canvas = document.querySelector('canvas')

if(canvas) {
  
  const footer = document.querySelector('footer') as HTMLElement
  const footerDim = footer.getBoundingClientRect()
  let ball = new Ball(canvas,{
    width: window.innerWidth,
    height: window.innerHeight - footerDim.height
  })
  
  ui()

  window.addEventListener('resize', () => {
    ball.changeBoundingBox({
      width: window.innerWidth,
      height: window.innerHeight - footerDim.height
    })
  })

}