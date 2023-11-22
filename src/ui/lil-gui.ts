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
  initOptions: (options: Options) => void,
){

  const gui = new GUI();

  const options:Options = {
    // attractor: 'clifford',
    // a: 2,
    // b: -2,
    // c: 1,
    // d: -1,
    // hue: 333,
    // saturation: 100
    attractor: 'dejong',
    a: -1.17,
    b: 1.03,
    c: 2.3,
    d: -0.9,
    hue: 333,
    saturation: 100
  }

  gui.add( options, 'attractor', [
    'clifford',
    'dejong'
  ]);

  gui.add( options, 'a', -3, 3);
  gui.add( options, 'b', -3, 3);
  gui.add( options, 'c', -3, 3);
  gui.add( options, 'd', -3, 3);
  gui.add( options, 'hue', 0, 360);
  gui.add( options, 'saturation', 0, 100);

  gui.onChange( event => {
    onChange(event.object as Options, true)
  })

  gui.onFinishChange( event => {
    onChange(event.object as Options, false)
  })

  initOptions( options )

  // const colornode = document.createElement("div");
  // colornode.classList.add('h-color')
  // gui.$children.appendChild(colornode)
  // console.log(gui.$children)

}