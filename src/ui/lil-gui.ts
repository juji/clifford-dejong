import './lil-gui.css'
import GUI from 'lil-gui'; 

export type Options = {
  attractor: 'clifford'|'dejong',
  a: number
  b: number
  c: number
  d: number
}

export default function optionPanel( 
  onChange: (options: Options, paused: boolean) => void,
  initOptions: (options: Options) => void,
){

  const gui = new GUI();

  const options:Options = {
    attractor: 'clifford',
    a: 2,
    b: -2,
    c: 1,
    d: -1,
  }

  gui.add( options, 'attractor', [
    'clifford',
    'dejong'
  ]);

  gui.add( options, 'a', -3, 3);
  gui.add( options, 'b', -3, 3);
  gui.add( options, 'c', -3, 3);
  gui.add( options, 'd', -3, 3);

  gui.onChange( event => {
    console.log('change')
    onChange(event.object as Options, true)
  })

  gui.onFinishChange( event => {
    console.log('finish')
    onChange(event.object as Options, false)
  })

  initOptions( options )

}