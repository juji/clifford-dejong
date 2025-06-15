import { Context2d } from './context2d';
import { type Options } from '@/state';

export default class Renderer {
  canvas: HTMLCanvasElement;
  context: Context2d | null = null;
  setImage: (img: string | null) => void | null;

  constructor(
    canvas: HTMLCanvasElement,
    width: number,
    height: number,
    options: Options,
    setProgress: (num: number) => void,
    setImage: (img: string | null) => void
  ) {
    this.canvas = canvas;
    this.canvas.width = width;
    this.canvas.height = height;
    this.setImage = setImage;

    this.context = new Context2d(this.canvas, options, setProgress);
  }

  onUpdate(options: Options) {
    this.context && this.context.setOptions(options)
  }

  onPaused() {
    if(!this.context) return;
    this.context.paused = true
  }

  onPlay() {
    if(!this.context) return;
    this.context.paused = false
    this.context.reset()
  }

  onResize(width: number, height: number) {
    this.canvas.width = width
    this.canvas.height = height
    this.context && this.context.onResize()
  }
}