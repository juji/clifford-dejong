
import { type UIOptions } from '../ui'
import { hsv2rgb } from './hsv2rgb'
import { clifford, dejong } from './attractors'
import BezierEasing from 'bezier-easing'

// clifford
// dejong
const saturationBezier = BezierEasing(.79,-0.34,.54,1.18)

// .75,.38,.24,1.33 *
// cubic-bezier(.63,.46,.24,1.33)
const lightnesBezier = BezierEasing(.75,.38,.24,1.33)


// smoothing comes before scale
function smoothing(num: number, scale: number){
  return num + (Math.random()<0.5?-0.2:0.2) * (1/(scale))  
}

function getColorData(
  dx: number, 
  dy: number, 
  density: number, 
  width: number,
  height: number,
  maxDensity: number,
  h: number,
  s: number
) : number{
  
  const mdens = Math.log(maxDensity)
  const pdens = Math.log(density)
  const v = lightnesBezier(pdens / mdens) * 100

  if(v<10) return 0 // this is black, return transparent instead

  const [ r, g, b ] = hsv2rgb(
    h,
    s - saturationBezier(pdens / mdens) * s,
    lightnesBezier(pdens / mdens) * 100,
  )
  
  return 255 << 24 | b << 16 | g << 8 | r
}

export class Context2d {

  context: CanvasRenderingContext2D
  options: UIOptions|null = null
  width: number
  height: number
  anim: number = 0
  scale: number = 150
  itt = 0
  maxItt = 100
  // perItt = 40000
  perItt = 100000

  x: number[] = [0];
  y: number[] = [0];
  lastX:number = 0
  lastY:number = 0

  paused = false

  // pixelsX: number[] = [] // dx
  // pixelsY: number[] = [] // dy
  // pixelsCount: number[] = [] // pixelCount

  // using map, instead of array
  // i believe it's faster
  // independent of screen size, it will only record used pixels
  // key = "x,y"
  pixels: {[key:string]: [number, number, number]} // dx, dy, pixelCount 

  attractor: ((x:number,y:number,a:number,b:number,c:number,d:number) => number[])|null = null
  background = 0
  maxDensity = 0
  startat: Date
  // green = 255<<24|0<<16|255<<8|0

  onProgress: ((n:number) => void)|null = null

  constructor( 
    canvas: HTMLCanvasElement, 
    options: UIOptions,
  ){
    this.context = canvas.getContext('2d') as CanvasRenderingContext2D
    this.width = canvas.width
    this.height = canvas.height
    this.context.translate(this.width/2, this.height/2)
    this.pixels = {}

    this.setOptions(options, false)
    this.startat = new Date()
  }

  reportProgress(n: number){
    this.onProgress && this.onProgress(n)
  }

  setOptions(options: UIOptions, paused: boolean){
    this.attractor = options.attractor === 'clifford' ? clifford : dejong
    this.options = options
    this.paused = paused
    this.reset()
  }

  reset(){
    if(this.anim) cancelAnimationFrame(this.anim)
    this.clear()
    
    this.pixels = {}
    this.x = [0]
    this.y = [0]
    this.itt = 0
    this.maxDensity = 0
    this.reportProgress(0)
    this.start()
  }

  onResize( canvas: HTMLCanvasElement ){
    this.width = canvas.width
    this.height = canvas.height
    this.context.translate(this.width/2, this.height/2)
    this.reset()
  }

  clear(){
    this.context.save()
    this.context.setTransform(1,0,0,1,0,0)
    this.context.clearRect(0, 0, this.width, this.height)
    this.context.restore()
  }

  drawBitmap(){

    let bitmap = this.context.createImageData(this.width, this.height);
    let buf = new ArrayBuffer(bitmap.data.length);
    let buf8 = new Uint8ClampedArray(buf);
    let data = new Uint32Array(buf);
    
    for(let y=0; y<this.height;y++){
      for(let x=0; x<this.width;x++){
        data[ x + (y*this.width) ] = this.pixels[`${x},${y}`] ? (
          // this.green
          getColorData(
            this.pixels[`${x},${y}`][0],
            this.pixels[`${x},${y}`][1],
            this.pixels[`${x},${y}`][2],
            this.width,
            this.height,
            this.maxDensity,
            this.options?.hue as number,
            this.options?.saturation as number
          )
        ) : this.background;
      }
    }
        
    bitmap.data.set(buf8);
    this.clear()
	  this.context.putImageData(bitmap, 0,0);

    // red square
    // this.context.beginPath();
    // this.context.rect(
    //   -29,
    //   -29, 
    //   54, 54
    // );
    // this.context.fillStyle = `rgb(255,0,0)`
    // this.context.fill()


  }

  start(){

    if(this.paused && this.itt>=20) return;
    if(this.itt >= this.maxItt) {
      console.log('before done', new Date().valueOf() - this.startat.valueOf() + 'ms')
      this.drawBitmap()
      return console.log('done', new Date().valueOf() - this.startat.valueOf() + 'ms');
    }

    this.itt++;

    if(!(this.itt%100)) console.log(`itt ${this.itt}`)

    let n = 0
    this.x = []
    this.y = []
    const itteration = this.paused ? 10000 : this.perItt
    while(n<itteration){
      this.calculate()
      n++
    }

    this.draw()
    this.anim = requestAnimationFrame(() => {
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
    
    const thisX = smoothing(x, this.scale) 
    const thisY = smoothing(y, this.scale)

    const screenX = Math.round(thisX * this.scale)
    const screenY = Math.round(thisY * this.scale)
    
    // translate index to 0,0
    // it will be used to calculate bitmap
    const index = `${screenX + (this.width/2)},${screenY + (this.height/2)}`
    if(!this.pixels[index]) this.pixels[index] = [0,0,0]
    this.pixels[index][0] += thisX - this.lastX
    this.pixels[index][1] += thisY - this.lastY //realY + (this.height/2)
    this.pixels[index][2] += 1

    if(this.maxDensity < this.pixels[index][2])
      this.maxDensity = this.pixels[index][2]
    
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
      // ctx.fillStyle = `hsla(${this.options?.hue},${(this.options?.saturation||0)*.3}%,50%, ${this.paused ? '1' : '0.1'})`
      ctx.fillStyle = `hsla(${this.options?.hue},${(this.options?.saturation||0)}%,50%, ${this.paused ? '1' : '0.1'})`
      ctx.fill()
      n++
    }

  }



}