
import MouseEvents from './mouse-events'
import TouchEvents from './touch-events'
import Ball from '../ball'

export function registerEvents( 
  ball: Ball,
  elm: HTMLElement 
){

  if(window.matchMedia("(any-hover: none)").matches) {
    
    const touch = new TouchEvents(elm, {
      onTouchDown: (e:TouchEvent) => {
        ball.slingShotInit(
          e.touches[0].pageX,
          e.touches[0].pageY
        )
      },
      onTouchMove: (e:TouchEvent) => {
        ball.slingShotPull(
          e.touches[0].pageX,
          e.touches[0].pageY
        )
      },
      onTouchUp: () => {
        ball.slingShotRelease()
      },
    })

    return () => touch.clear && touch.clear()

  }else{

    const mouse = new MouseEvents(elm, {
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

    return () => mouse.clear && mouse.clear()

  }


}