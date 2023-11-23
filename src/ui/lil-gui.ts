import './lil-gui.css'
import GUI from 'lil-gui'; 

import { optionStore, type Options } from '@/state'

export default function optionPanel(){

  const gui = new GUI();

  const { getState } = optionStore
  const { setOptions, options, setPaused } = getState()

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
    setPaused(true)
    setOptions(event.object as Partial<Options>)
  })

  gui.onFinishChange( event => {
    setPaused(false)
    setOptions(event.object as Partial<Options>)
  })

  // gui.controllers

}