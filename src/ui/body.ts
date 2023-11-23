import { optionStore } from '@/state'

export function body(){
  
  const { subscribe } = optionStore
  const body = document.querySelector('body') as HTMLElement

  subscribe((state) => state.options, (options) => {

    if(options.brightness < 5){
      body.style.setProperty(
        '--background-color',
        '#202020'
      )
    }else{
      body.style.removeProperty(
        '--background-color'
      )
    }

  },{
    fireImmediately: true
  })

}