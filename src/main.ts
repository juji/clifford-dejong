// create something awesome!!

import './index.css'
import './button.css'

import { optionStore } from '@/state'

import Renderer from './renderer'
import { ui } from './ui'
const canvas = document.querySelector('canvas')

// gem


// coGem
console.log(`
    /\\_/\\
   / o o \\
  (   ^   )
   \ === /
    ----- 
`);

// coCld
console.log(`
    /\\_/\\
   ( o.o )
    > ^ <
   /  |  \\
   \\___|___/
`);

// coChat
console.log(`\n   _____       _ _   _     _   \n  / ____|     (_) | | |   | |  \n | |     ___   _| |_| |__ | |_ \n | |    / _ \\ | | __| '_ \\| __|\n | |___| (_) || | |_| | | | |_ \n  \\_____\\___(_)_|\\__|_| |_|\\__|\n      GitHub Copilot\n`);

// gem
console.log(`
  _.-""\`-._
 .'          \`.
/   O      O   \\
|    \\  ^^  /    |
\\     \`----'     /
 \`. _______ .'
   //_____\\\\
`);

/*
  =================================
  = Why do programmers prefer     =
  =     D A R K   M O D E ?       =
  =                               =
  = Because light attracts BUGS!  =
  =        <(-_-)>                =
  =================================
*/

// chat
console.log(`
  /\\_/\\
 ( o.o )  meow~
  > ^ <
`);


// yes there's a difference


if(canvas) {
  
  const footer = document.querySelector('footer') as HTMLElement
  const footerDim = footer.getBoundingClientRect()
  const { subscribe } = optionStore
  const { options, setProgress, setImage, setPaused, resetOptions } = optionStore.getState()

  // Define dummy setStart and setFinish functions for now
  // TODO: Implement proper start/finish logic if needed
  const setStart = () => console.log('Renderer started');
  const setFinish = () => {
    console.log('Renderer finished');
    // Example: Maybe automatically save the image?
    // const dataURL = canvas?.toDataURL('image/png');
    // if (dataURL) setImage(dataURL);
  };

  ui()

  const renderer = new Renderer(
    canvas,
    window.innerWidth,
    window.innerHeight - footerDim.height,
    options,
    setProgress,
    setFinish, // Pass the setFinish callback
    setStart   // Pass the setStart callback
  )


  subscribe((state) => state.options, (s) => {
    renderer.onUpdate(s)
  })

  subscribe((state) => state.paused, (paused) => {
    paused ? renderer.onPaused() : renderer.onPlay()
  })
  

  // renderer.onProgress(onProgress)
  // renderer.onFinish(onImageReady)

  window.addEventListener('resize', () => {
    const footerDim = footer.getBoundingClientRect()
    renderer.onResize(
      window.innerWidth,
      window.innerHeight - footerDim.height
    )
  })

}