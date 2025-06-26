import { optionStore } from '@/state'

export function body(){
  
  const { subscribe } = optionStore
  const body = document.querySelector('body') as HTMLElement

  subscribe((state) => state.options, (options) => {
    body.style.setProperty(
      '--background-color',
      `rgb(${options.background[0]},${options.background[1]},${options.background[2]})`
    )
  },{
    fireImmediately: true
  })

}