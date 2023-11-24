
import optionPanel from './lil-gui'
import { progressReport } from './progress'
import { downloadButton } from './download-button'
import { footer } from './footer'
import { body } from './body'
import { resetButton } from './reset-button'
import { mouseWheel } from './mouse-events'
import { touchEvents } from './touch-events'
import { fullScreenButton } from './full-screen'
import { infoButton } from './info-button'

export function ui(){
  
  // option panel
  optionPanel()
  
  //
  progressReport()
  footer()
  body()
  
  // buttons
  infoButton()
  downloadButton()
  resetButton()
  fullScreenButton()

  //
  mouseWheel()
  touchEvents()

}