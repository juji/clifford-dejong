import optionPanel, { type Options } from './lil-gui'

export type UIOptions = Options;
export function ui( 
  onChange: (options: Options, paused: boolean) => void,
  initOptions: (options: Options) => void,
){

  const button = document.querySelector('button.info-button')
  const content = document.querySelector('.info-content')

  let to: ReturnType<typeof setTimeout>
  button?.addEventListener('click', () => { 
    
    button.classList.toggle('on')
    content?.classList.toggle('on')
    to && clearTimeout(to)
    
    if(content?.classList.contains('on')) {
      to = setTimeout(() => {
        button.classList.remove('on')
        content?.classList.remove('on')
      }, 5000)
    }
  })


  /// option panel
  optionPanel( onChange, initOptions )

}