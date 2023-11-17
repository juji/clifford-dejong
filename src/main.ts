// create something awesome!!

import './index.css'
import Ball from './ball'
import MouseEvents from './mouse-events'
import { setLogoColor } from './set-logo-color'

const logoDim = 89;
const canvas = document.querySelector('canvas')

if(canvas) {

  const main = document.querySelector('main') as HTMLElement
  const dim = main.getBoundingClientRect()
  let ball = new Ball(canvas,{
    width: dim?.width,
    height: dim.height
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

  new MouseEvents(canvas, {
    onMouseDown: (e:MouseEvent) => {
      ball.slingShotInit(
        e.pageX,
        e.pageY
      )
    },
    onMouseMove: (e:MouseEvent) => {
      ball.slingShotPull(
        e.pageX,
        e.pageY
      )
    },
    onMouseUp: (e:MouseEvent) => {
      ball.slingShotRelease(
        e.pageX,
        e.pageY
      )
    },
  })

  window.addEventListener('resize', () => {
    ball.changeBoundingBox({
      width: window.innerWidth,
      height: window.innerHeight
    })
  })

}