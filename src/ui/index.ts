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

  // footer, body for color
  const footer = document.querySelector('footer') as HTMLElement
  const body = document.querySelector('body') as HTMLElement

  // get hsl from options
  function getHsl(options: Options, minBrightness:number = 40){
    return `hsl(${options.hue},${options.saturation}%,${Math.max(
      minBrightness,options.brightness/2
    )}%)`
  }

  /// option panel
  function localOnChange(options: Options, paused: boolean){
    onChange(options, paused)
    setColor(getHsl(options))

    // also set footer color
    footer && footer.style.setProperty(
      '--footer-color', 
      getHsl(options)
    )

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
  }

  const init = optionPanel( localOnChange )
  initOptions(init)
  setColor(getHsl(init))
  
  footer && footer.style.setProperty(
    '--footer-color', 
    getHsl(init)
  )

  if(init.brightness < 5){
    body.style.setProperty(
      '--background-color',
      '#202020'
    )
  }


  return setProgress


}