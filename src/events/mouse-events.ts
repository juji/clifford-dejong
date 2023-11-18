

export default class MouseEvents {

  elm: HTMLElement
  onMouseUp: null | ((e:MouseEvent) => void) = null
  onMouseDown: null | ((e:MouseEvent) => void) = null
  onMouseMove: null | ((e:MouseEvent) => void) = null
  clear: null | (() => void) = null

  constructor(elm: HTMLElement, {
    onMouseUp,
    onMouseDown,
    onMouseMove
  }:{
    onMouseUp: (e:MouseEvent) => void
    onMouseDown: (e:MouseEvent) => void
    onMouseMove: (e:MouseEvent) => void
  }){

    this.elm = elm
    this.onMouseUp = onMouseUp
    this.onMouseDown = onMouseDown
    this.onMouseMove = onMouseMove

    let t = this
    let mouseMoveListener = (e:MouseEvent) => {
      e.preventDefault()
      t.onMouseMove && t.onMouseMove(e)
      return false
    }

    let mouseDownListener = (e:MouseEvent) => {
      e.preventDefault()
      t.onMouseDown && t.onMouseDown(e)
      if(t.onMouseMove) elm.addEventListener('mousemove', mouseMoveListener)
      return false
    }

    let mouseUpListener = (e: MouseEvent) => {
      e.preventDefault()
      t.onMouseUp && t.onMouseUp(e)
      if(t.onMouseMove) elm.removeEventListener('mousemove', mouseMoveListener)
      return false
    }

    elm.addEventListener('mousedown', mouseDownListener)
    elm.addEventListener('mouseup', mouseUpListener)

    this.clear = () => {
      elm.removeEventListener('mousedown', mouseDownListener)
      elm.removeEventListener('mouseup', mouseUpListener)
      elm.removeEventListener('mousemove', mouseMoveListener)
    }

  }

}