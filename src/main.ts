// create something awesome!!

import './index.css'
import './button.css'

import Ball from './ball'
import { registerEvents } from './events'
import { setLogoColor } from './set-logo-color'
import { setButtonClick } from './button-click'

setButtonClick()
const logoDim = 89;
const canvas = document.querySelector('canvas')

if(canvas) {

  const footer = document.querySelector('footer') as HTMLElement
  const footerDim = footer.getBoundingClientRect()
  let ball = new Ball(canvas,{
    width: window.innerWidth,
    height: window.innerHeight - footerDim.height
  })

  // change logo color when hit
  let to: ReturnType<typeof setTimeout>|null;
  ball.onMove = (x: number, y: number) => {
    if(x <= logoDim && y <= logoDim){
      if(to) {
        clearTimeout(to)
        to = setTimeout(() => {
          to = null
        },500)
      }else{
        to = setTimeout(() => {
          to = null
        },500)
        setLogoColor()
      }
    }
  }

  // const clear = 
  registerEvents(
    ball,
    canvas
  )

  window.addEventListener('resize', () => {
    ball.changeBoundingBox({
      width: window.innerWidth,
      height: window.innerHeight - footerDim.height
    })
  })

}