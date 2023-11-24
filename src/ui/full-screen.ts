import './full-screen.css'

export function fullScreenButton(){
  
  const fullScreenButton = document.querySelector('button.full-screen') as HTMLElement
  const footer = document.querySelector('footer') as HTMLElement
  const lilgui = document.querySelector('.lil-gui') as HTMLElement
  if(!fullScreenButton) return;

  fullScreenButton.addEventListener('click',() => {

    if(!document.fullscreenElement){
      fullScreenButton.classList.add('on')
      footer.classList.add('full-screen')
      lilgui.classList.add('full-screen')
      document.documentElement.requestFullscreen();
    }else{
      fullScreenButton.classList.remove('on')
      footer.classList.remove('full-screen')
      lilgui.classList.remove('full-screen')
      document.exitFullscreen();
    }
  })

}