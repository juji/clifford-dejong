import { optionStore } from '@/state'


export function reset(){

  const { getState } = optionStore
  const { resetOptions, setPaused } = getState()

  const reset = document.querySelector('.reset-button')
  if(!reset) return;

  reset.addEventListener('click',() => {
    resetOptions()
    setPaused(false)
  })

}