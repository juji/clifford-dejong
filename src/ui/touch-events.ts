
import { optionStore } from '@/state'

export function touchEvents(){

  const main = document.querySelector('main')
  if(!main) return;

  if(!window.matchMedia("(any-hover: none)").matches) return;
  
  const { getState, subscribe } = optionStore
  const { setScale, setTopLeft, setPaused, options } = getState()

  let { scale, top, left } = options
  subscribe((state) => state.options,(options) => {
    scale = options.scale
  })

  let initX = 0
  let initY = 0
  function onTouchStart(e: TouchEvent){
    if(e.touches.length > 1) return;
    e.preventDefault()
    setPaused(true)
    initX = e.touches[0].pageX
    initY = e.touches[0].pageY
    main && main.addEventListener('touchmove', onTouchMove)
    return false
  }

  function onTouchMove(e: TouchEvent){
    if(e.touches.length > 1) return;
    e.preventDefault()
    setPaused(false)
    const topDelta = (initY - e.touches[0].pageY) / window.innerHeight
    const leftDelta = (initX - e.touches[0].pageX) / window.innerWidth
    setTopLeft(
      top - topDelta,
      left - leftDelta
    )
    return false
  }

  function onTouchEnd(e: TouchEvent){
    if(e.touches.length > 1) return;
    e.preventDefault()
    setPaused(false)
    const { options } = getState()
    top = options.top
    left = options.left 
    main && main.removeEventListener('touchmove', onTouchMove)
    return false
  }

  main.addEventListener('touchstart', onTouchStart)
  main.addEventListener('touchend', onTouchEnd)
  

}
