
import { type UIOptions } from '../ui'
import { Context2d } from './context2d'

export default class Renderer {

  canvas: HTMLCanvasElement
  options: UIOptions|null = null
  context: Context2d|null = null

  constructor(
    canvas: HTMLCanvasElement,
    width: number,
    height: number
  ){

    this.canvas = canvas
    this.canvas.width = width
    this.canvas.height = height

  }

  setOptions( options: UIOptions, paused: boolean ){
    if(this.context) {
      this.context.setOptions(options, paused)
    }
    else{
      this.context = new Context2d( this.canvas, options )
    }
  }

  onResize(width: number, height: number){

    this.canvas.width = width
    this.canvas.height = height
    this.context && this.context.onResize(
      this.canvas
    )

  }

}