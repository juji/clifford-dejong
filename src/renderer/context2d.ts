
import { type UIOptions } from '../ui'
import { hsv2rgb } from './hsv2rgb'
import { clifford, dejong } from './attractors'

// smoothing comes before scale
function smoothing(num: number, scale: number){
  return num + (Math.random()<0.5?-0.2:0.2) * (1/(scale))  
}

function getColorData(dx: number, dy:number, density: number, maxDensity: number) : number{
  
  // console.log('hsv2rgb')
  const [ r, g, b ] = hsv2rgb(
    360,
    100,
    100,
  )
  // console.log(rgb)
  
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
  maxItt = 200
  perItt = 40000

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
  green = 255<<24|0<<16|255<<8|0
  maxDensity = 0
  startat: Date

  constructor( canvas: HTMLCanvasElement, options: UIOptions ){
    this.context = canvas.getContext('2d') as CanvasRenderingContext2D
    this.width = canvas.width
    this.height = canvas.height
    this.context.translate(this.width/2, this.height/2)
    this.pixels = {}

    this.setOptions(options, false)
    this.startat = new Date()
  }

  setOptions(options: UIOptions, paused: boolean){
    this.attractor = options.attractor === 'clifford' ? clifford : dejong
    this.options = options
    this.paused = paused
    this.reset()
  }

  reset(){
    if(this.anim) cancelAnimationFrame(this.anim)
    
    this.pixels = {}

    this.clear()
    this.x = [0]
    this.y = [0]
    this.itt = 0
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

  onDone(){

    // this.context.translate( -this.width/2, -this.height/2 )
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
            this.maxDensity
          )
        ) : this.background;
      }
    }
        
    bitmap.data.set(buf8);
    this.clear()
	  this.context.putImageData(bitmap, 0,0);
    this.context.beginPath();
    this.context.rect(
      0,
      0, 
      54, 54
    );
    this.context.fillStyle = `rgb(255,0,0)`
    this.context.fill()


  }

  start(){

    if(this.paused && this.itt>=1) return;
    if(this.itt >= this.maxItt) {
      console.log('before done', new Date().valueOf() - this.startat.valueOf() + 'ms')
      this.onDone()
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
    
    // const thisX = smoothing(x, this.scale) 
    // const thisY = smoothing(y, this.scale)
    const thisX = smoothing(x, this.scale) 
    const thisY = smoothing(y, this.scale)

    const realX = Math.round(thisX * this.scale)
    const realY = Math.round(thisY * this.scale)
    
    // translate index to 0,0
    // it wil lbe used to calculate bitmap
    const index = `${realX + (this.width/2)},${realY + (this.height/2)}`
    if(!this.pixels[index]) this.pixels[index] = [0,0,0]
    this.pixels[index][0] += thisX - this.lastX
    this.pixels[index][1] += thisY - this.lastY
    this.pixels[index][2] += 1

    if(this.maxDensity < this.pixels[index][2])
      this.maxDensity = this.pixels[index][2]
    
    this.lastX = thisX
    this.lastY = thisY
    this.x.push(realX)
    this.y.push(realY)



  }

  draw(){

    let n = 0;
    const ctx = this.context
    while(n<this.x.length){
      ctx.beginPath();
      ctx.rect(
        this.x[n], 
        this.y[n], 
        1, 1
      );
      ctx.fillStyle = `hsla(100,10%,40%, ${this.paused ? '1' : '0.1'})`
      ctx.fill()
      n++
    }

  }



}