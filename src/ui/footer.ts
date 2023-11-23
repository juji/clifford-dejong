import { optionStore } from '@/state'
import { getHsl } from './utils'

export function footer(){
  
  const { subscribe } = optionStore
  const footer = document.querySelector('footer') as HTMLElement

  subscribe((state) => state.options, (options) => {
    footer && footer.style.setProperty(
      '--footer-color', 
      getHsl(options)
    )
  },{
    fireImmediately: true
  })

}