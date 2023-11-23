
import optionPanel from './lil-gui'
import { progressReport } from './progress'
import { downloadButton } from './download-button'
import { footer } from './footer'
import { body } from './body'
import { reset } from './reset'
import { mouseWheel } from './mouse-events'
import { touchEvents } from './touch-events'

export function ui(){

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
  progressReport()

  //
  footer()
  body()

  // download button
  downloadButton()

  // option panel
  optionPanel()

  // reset button
  reset()

  //
  mouseWheel()
  touchEvents()

}