import './lil-gui.css'
import GUI, { type Controller } from 'lil-gui'; 

export type Options = {
  attractor: 'clifford'|'dejong',
  a: number
  b: number
  c: number
  d: number
  hue: number
  saturation: number
  brightness: number
  scale: number
  top: number
  left: number
}

export default function optionPanel( 
  onChange: (options: Options, paused: boolean) => void,
): {
  options: Options
  controllers: Controller[]
} {

  const gui = new GUI();

  // get option from local storage
  const lskey = 'juji-cd-data'
  let ls = localStorage.getItem(lskey) 
  const savedOpt = ls ? JSON.parse(ls) as Options : {}

  const options:Options = {
    
    attractor: 'clifford',
    a: 2,
    b: -2,
    c: 1,
    d: -1,
    hue: 333,
    saturation: 100,
    brightness: 100,
    scale: 1,
    top: 0,
    left: 0,

    ...savedOpt

    // attractor: 'dejong',
    // a: -0.59,
    // b: -4.82,
    // c: 2.42,
    // d: 1.46,
    // hue: 333,
    // saturation: 100
  }

  gui.add( options, 'attractor', [
    'clifford',
    'dejong'
  ]);

  gui.add( options, 'a', -5, 5);
  gui.add( options, 'b', -5, 5);
  gui.add( options, 'c', -5, 5);
  gui.add( options, 'd', -5, 5);

  gui.add( options, 'hue', 0, 360);
  gui.add( options, 'saturation', 0, 100);
  gui.add( options, 'brightness', 0, 100);

  gui.add( options, 'scale', 0.001, 5);
  gui.add( options, 'top', -1, 1);
  gui.add( options, 'left', -1, 1);

  gui.onChange( event => {
    onChange(event.object as Options, true)
  })

  gui.onFinishChange( event => {
    localStorage.setItem(lskey, JSON.stringify(event.object))
    onChange(event.object as Options, false)
  })

  return {
    options,
    controllers: gui.controllers
  }

  // const colornode = document.createElement("div");
  // colornode.classList.add('h-color')
  // gui.$children.appendChild(colornode)
  // console.log(gui.$children)

}