import './lil-gui.css'
import GUI from 'lil-gui'; 

import { optionStore, type Options, VALUELIMIT } from '@/state'

export default function optionPanel(){

  const gui = new GUI();

  const { getState, subscribe } = optionStore
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
  // gui.addColor( options, 'background', 255);

  gui.add( options, 'scale', VALUELIMIT.scale[0], VALUELIMIT.scale[1]);
  gui.add( options, 'top', VALUELIMIT.top[0], VALUELIMIT.top[1]);
  gui.add( options, 'left', VALUELIMIT.left[0], VALUELIMIT.left[1]);

  let updateFromOutside = false
  gui.onChange( event => {
    if(updateFromOutside) return;
    setPaused(true)
    setOptions(event.object as Partial<Options>)
  })

  gui.onFinishChange( event => {
    if(updateFromOutside) return;
    console.log('pausing...')
    setPaused(false)
    setOptions(event.object as Partial<Options>)
  })

  // gui.controllers

  subscribe((state) => state.options, (opt) => {

    gui.controllers.forEach(controller => {
      const key = controller._name as keyof typeof opt
      if(opt[key] !== controller.getValue()) {
        updateFromOutside = true
        controller.setValue(opt[key])
      }
    })

    if(updateFromOutside) setTimeout(() => {
      updateFromOutside = false
    },100)

  })

}