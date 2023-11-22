import optionPanel, { type Options } from './lil-gui'
import { progressReport } from './progress'

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


  // setProgress
  const { setProgress, setColor } = progressReport()

  // footer, for color
  const footer = document.querySelector('footer') as HTMLElement

  /// option panel
  function localOnChange(options: Options, paused: boolean){
    onChange(options, paused)
    setColor(`hsl(${options.hue},${options.saturation}%,50%)`)

    // also set footer color
    footer && footer.style.setProperty(
      '--footer-color', 
      `hsl(${options.hue},${options.saturation}%,50%)`
    )
  }

  const init = optionPanel( localOnChange )
  initOptions(init)
  setColor(`hsl(${init.hue},${init.saturation}%,50%)`)


  return setProgress


}