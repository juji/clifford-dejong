import './lil-gui.css'
import GUI from 'lil-gui'; 

export type Options = {
  attractor: 'clifford'|'dejong',
  a: number
  b: number
  c: number
  d: number
  hue: number
  saturation: number
}

export default function optionPanel( 
  onChange: (options: Options, paused: boolean) => void,
): Options {

  const gui = new GUI();

  const options:Options = {
    attractor: 'clifford',
    a: 2,
    b: -2,
    c: 1,
    d: -1,
    hue: 333,
    saturation: 100
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

  gui.onChange( event => {
    onChange(event.object as Options, true)
  })

  gui.onFinishChange( event => {
    onChange(event.object as Options, false)
  })

  return options

  // const colornode = document.createElement("div");
  // colornode.classList.add('h-color')
  // gui.$children.appendChild(colornode)
  // console.log(gui.$children)

}