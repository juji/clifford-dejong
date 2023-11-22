
import { type UIOptions } from '../ui'
import { hsv2rgb } from './hsv2rgb'
import { clifford, dejong } from './attractors'
import BezierEasing from 'bezier-easing'

const saturationBezier = BezierEasing(.79,-0.34,.54,1.18)
const lightnesBezier = BezierEasing(.75,.38,.24,1.33)

// smoothing comes before scale
function smoothing(num: number, scale: number){
  return num + (Math.random()<0.5?-0.2:0.2) * (1/(scale))  
}

function getColorData(
  density: number, 
  maxDensity: number,
  h: number,
  s: number,
  v: number
) : number{
  
  const mdens = Math.log(maxDensity)
  const pdens = Math.log(density)
  let localV = lightnesBezier(pdens / mdens) * v

  // this is manual labour, because i don't have anything better to do
  // pardon the static value
  if(v <= 5 && (density/maxDensity) < 0.0025){
    return 0
  }

  const [ r, g, b ] = hsv2rgb(
    h,
    s - saturationBezier(pdens / mdens) * s,
    localV,
  )
  
  return 255 << 24 | b << 16 | g << 8 | r
}

export class Context2d {

  context: CanvasRenderingContext2D
  options: UIOptions|null = null
  
  width: number
  height: number
  centerX: number
  centerY: number
  centerXRatio: number = 0
  centerYRatio: number = 0
  
  anim: number = 0
  scale: number = 150
  scaleRatio: number = 1
  itt = 0
  maxItt = 100
  perItt = 100000

  x: number[] = [0];
  y: number[] = [0];
  lastX:number = 0
  lastY:number = 0

  paused = false

  // a place to put pixel data
  // somehow, this faster than using map
  pixels: number[]

  attractor: ((x:number,y:number,a:number,b:number,c:number,d:number) => number[])|null = null
  background = 0
  maxDensity = 0
  // green = 255<<24|0<<16|255<<8|0

  onProgress: ((n:number) => void)|null = null
  onFinish: (() => void)|null = null
  onStart: (() => void)|null = null

  constructor( 
    canvas: HTMLCanvasElement, 
    options: UIOptions,
  ){
    this.context = canvas.getContext('2d') as CanvasRenderingContext2D
    this.width = canvas.width
    this.height = canvas.height
    this.centerX = this.width - (this.width/2) + (this.centerXRatio * this.width)
    this.centerY = this.height - (this.height/2) + (this.centerYRatio * this.height)
    this.context.translate(this.centerX, this.centerY)
    this.pixels = new Array(this.width*this.height).fill(0)

    this.setOptions(options, false)
  }

  reportProgress(n: number){
    this.onProgress && this.onProgress(n)
  }

  setOptions(options: UIOptions, paused: boolean){
    this.options = options
    this.paused = paused
    this.reset()
  }

  reset(){

    if(this.anim) cancelAnimationFrame(this.anim)
    
    this.attractor = this.options?.attractor === 'clifford' ? clifford : dejong
    this.pixels = new Array(this.width*this.height).fill(0)
    this.x = [0]
    this.y = [0]
    this.itt = 0

    this.context.setTransform(1,0,0,1,0,0)
    this.context.clearRect(0, 0, this.width, this.height)
    this.scaleRatio = Math.max(0.001, this.options?.scale as number)
    this.centerXRatio = this.options?.left as number
    this.centerYRatio = this.options?.top as number
    this.centerX = this.width - (this.width/2) + (this.centerXRatio * this.width)
    this.centerY = this.height - (this.height/2) + (this.centerYRatio * this.height)
    this.context.translate(this.centerX, this.centerY)

    this.maxDensity = 0
    this.reportProgress(0)
    this.onStart && this.onStart()
    this.start()

  }
  
  onResize( canvas: HTMLCanvasElement ){
    this.width = canvas.width
    this.height = canvas.height
    this.reset()
  }

  drawBitmap(){

    let bitmap = this.context.createImageData(this.width, this.height);
    let buf = new ArrayBuffer(bitmap.data.length);
    let buf8 = new Uint8ClampedArray(buf);
    let data = new Uint32Array(buf);
    
    let dataLen = this.height * this.width

    for(let i=0; i<dataLen;i++){
      data[ i ] = this.pixels[ i ] ? (
        // this.green
        getColorData(
          this.pixels[ i ],
          this.maxDensity,
          this.options?.hue as number,
          this.options?.saturation as number,
          this.options?.brightness as number
        )
      ) : this.background;
    }
        
    bitmap.data.set(buf8);
	  this.context.putImageData(bitmap, 0,0);

  }

  start(){

    const start = new Date().valueOf()
    
    if(this.paused && this.itt>=20) return;
    if(this.itt >= this.maxItt) {
      this.drawBitmap()
      this.onFinish && this.onFinish()
      return;
    }

    let n = 0
    this.x = []
    this.y = []
    const itteration = this.paused ? 10000 : this.perItt
    while(n<itteration){
      this.calculate()
      n++
    }
    
    this.draw()
    
    this.itt++;
    // if(!(this.itt%100)) console.log(`itt ${this.itt}`)

    this.anim = requestAnimationFrame(() => {
      const end = new Date().valueOf() - start
      
      // if this takes more than 150ms
      // lower run per itterration
      // and increase total itteration
      if(end > 150){
        this.maxItt = this.maxItt * 2
        this.perItt = this.perItt / 2
      }

      this.reportProgress(100 * this.itt / this.maxItt)
      this.start()
    })
  }

  calculate(){

    if(!this.attractor) throw new Error('Attractor not set')
    if(!this.options) throw new Error('Options not set')

    const { a, b, c, d } = this.options
    const [ x, y ] = this.attractor(
      this.lastX, this.lastY, 
      a, b, c, d
    )
    
    const thisX = smoothing(x, this.scale * this.scaleRatio) 
    const thisY = smoothing(y, this.scale * this.scaleRatio)

    const screenX = Math.round(thisX * this.scale * this.scaleRatio)
    const screenY = Math.round(thisY * this.scale * this.scaleRatio)
    
    // translate index to 0,0
    // it will be used to calculate bitmap
    const indexX = Math.floor(screenX + this.centerX)
    const indexY = Math.floor(screenY + this.centerY)
    
    const index = indexX + (indexY*this.width)
    
    if(
      index < this.pixels.length &&
      indexX>=0 && indexX<this.width &&
      indexY>=0 && indexY<this.height
    ) {
      this.pixels[index] += 1
      if(this.maxDensity < this.pixels[index])
        this.maxDensity = this.pixels[index]
    }
    
    this.lastX = thisX
    this.lastY = thisY
    this.x.push(screenX)
    this.y.push(screenY)

  }

  draw(){

    if(!this.paused &&
      (this.itt%50 === 0) &&
      this.maxItt !== this.itt
    ){
      this.drawBitmap()
    }

    let n = 0;
    const ctx = this.context
    while(n<this.x.length){
      ctx.beginPath();
      ctx.rect(
        this.x[n], 
        this.y[n], 
        1, 1
      );

      ctx.fillStyle = `hsla(`+
        `${this.options?.hue},`+
        `${(this.options?.saturation||0)}%,`+
        `${(this.options?.brightness||0)/3}%, ${this.paused ? '1' : '0.1'})`

      ctx.fill()
      n++
    }

  }



}