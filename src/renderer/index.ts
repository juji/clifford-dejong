
import { type UIOptions } from '../ui'
import { Context2d } from './context2d'

export default class Renderer {

  canvas: HTMLCanvasElement
  options: UIOptions|null = null
  context: Context2d|null = null

  onFinishCallback: (( pngDataUrl: string ) => void) | null = null
  onBeforeStartCallback: (() => void) | null = null

  constructor(
    canvas: HTMLCanvasElement,
    width: number,
    height: number,
  ){

    this.canvas = canvas
    this.canvas.width = width
    this.canvas.height = height

  }

  setOptions( options: UIOptions, paused: boolean ){
    if(this.context) {
      this.context.setOptions(options, paused)
    }else{
      this.context = new Context2d( 
        this.canvas, 
        options
      )
      this.context.onFinish = this.onFinish
      this.context.onStart = this.onStart
    }
  }

  onFinish(){
    this.onFinishCallback && this.onFinishCallback(
      this.canvas.toDataURL("image/png")
    )
  }

  onStart(){
    this.onBeforeStartCallback && this.onBeforeStartCallback()
  }
  
  setOnProgress(onProgress: (n: number) => void){
    if(!this.context) return;
    this.context.onProgress = onProgress
  }

  onResize(width: number, height: number){

    this.canvas.width = width
    this.canvas.height = height
    this.context && this.context.onResize(
      this.canvas
    )

  }

}